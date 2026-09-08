const db = require("../config/db");
const { getTodayDayName } = require("../utils/dailyPriceCalculator");

// =============================
// PLACE ORDER (Supports both Cart Checkout & Direct Buy Now)
// =============================
const placeOrder = (req, res) => {
    const {
        user_id,
        product_id,
        quantity,
        shipping_name,
        shipping_phone,
        shipping_address,
        discount_amount
    } = req.body;

    if (!user_id) {
        return res.status(400).json({
            success: false,
            message: "User ID is required."
        });
    }

    // Optional: update user phone / address if provided
    if (shipping_phone || shipping_address) {
        db.query(
            "UPDATE users SET phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE user_id = ?",
            [shipping_phone || null, shipping_address || null, user_id]
        );
    }

    const todayName = getTodayDayName();

    // Case 1: Direct Single Product "Buy Now"
    if (product_id) {
        const prodSql = `
            SELECT p.*, COALESCE(dp.price, p.price) AS price 
            FROM products p 
            LEFT JOIN daily_prices dp ON p.product_id = dp.product_id AND dp.day_name = ?
            WHERE p.product_id = ?
        `;
        db.query(prodSql, [todayName, product_id], (err, products) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (products.length === 0) return res.status(404).json({ success: false, message: "Product not found." });

            const prod = products[0];
            const qty = parseInt(quantity) || 1;
            const itemPrice = Number(prod.price) || 0;
            const subtotal = itemPrice * qty;
            const discount = Number(discount_amount) || 0;
            const finalAmount = Math.max(0, subtotal - discount);

            const orderSql = "INSERT INTO orders (user_id, total_amount, order_status) VALUES (?, ?, 'Pending')";
            db.query(orderSql, [user_id, finalAmount], (err, orderRes) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                const orderId = orderRes.insertId;

                const itemSql = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
                db.query(itemSql, [orderId, product_id, qty, itemPrice], (err) => {
                    if (err) console.error("Error inserting order item:", err.message);

                    // Deduct stock
                    db.query("UPDATE products SET quantity = GREATEST(0, quantity - ?) WHERE product_id = ?", [qty, product_id]);

                    return res.status(201).json({
                        success: true,
                        message: "Order placed successfully!",
                        orderId,
                        totalAmount: subtotal,
                        finalAmount,
                        orderStatus: "Pending"
                    });
                });
            });
        });
        return;
    }

    // Case 2: Cart-Based Multi-Item Checkout
    const cartSql = `
        SELECT
            c.cart_id,
            c.product_id,
            c.quantity,
            p.product_name,
            COALESCE(dp.price, p.price) AS price,
            p.quantity AS stock_quantity
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        LEFT JOIN daily_prices dp ON p.product_id = dp.product_id AND dp.day_name = ?
        WHERE c.user_id = ?
    `;

    db.query(cartSql, [todayName, user_id], (err, cartItems) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty. Please add items to your cart."
            });
        }

        let totalAmount = 0;
        cartItems.forEach(item => {
            totalAmount += Number(item.price) * item.quantity;
        });

        const discount = Number(discount_amount) || 0;
        const finalAmount = Math.max(0, totalAmount - discount);

        const orderSql = `
            INSERT INTO orders
            (user_id, total_amount, order_status)
            VALUES (?, ?, 'Pending')
        `;

        db.query(orderSql, [user_id, finalAmount], (err, orderResult) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            const orderId = orderResult.insertId;
            let completed = 0;

            cartItems.forEach(item => {
                const itemSql = `
                    INSERT INTO order_items
                    (order_id, product_id, quantity, price)
                    VALUES (?, ?, ?, ?)
                `;

                db.query(
                    itemSql,
                    [orderId, item.product_id, item.quantity, item.price],
                    (err) => {
                        if (err) {
                            console.error("Error inserting order item:", err.message);
                        }

                        // Decrease product inventory quantity
                        db.query(
                            "UPDATE products SET quantity = GREATEST(0, quantity - ?) WHERE product_id = ?",
                            [item.quantity, item.product_id]
                        );

                        completed++;

                        if (completed === cartItems.length) {
                            // Clear cart
                            db.query("DELETE FROM cart WHERE user_id = ?", [user_id]);

                            res.status(201).json({
                                success: true,
                                message: "Order placed successfully!",
                                orderId,
                                totalAmount,
                                finalAmount,
                                orderStatus: "Pending"
                            });
                        }
                    }
                );
            });
        });
    });
};

// =============================
// GET USER ORDERS
// =============================
const getUserOrders = (req, res) => {
    const { user_id } = req.params;

    const sql = `
        SELECT
            o.order_id,
            o.user_id,
            o.total_amount,
            o.order_status,
            o.order_date,
            u.full_name,
            u.email,
            u.phone,
            u.address,
            oi.order_item_id,
            oi.product_id,
            oi.quantity,
            oi.price,
            p.product_name,
            p.image,
            p.category,
            p.brand
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE o.user_id = ?
        ORDER BY o.order_id DESC
    `;

    db.query(sql, [user_id], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        const ordersMap = {};
        rows.forEach(row => {
            if (!ordersMap[row.order_id]) {
                ordersMap[row.order_id] = {
                    order_id: row.order_id,
                    user_id: row.user_id,
                    total_amount: row.total_amount,
                    final_amount: row.total_amount,
                    order_status: row.order_status,
                    shipping_name: row.full_name,
                    shipping_phone: row.phone,
                    shipping_address: row.address,
                    order_date: row.order_date,
                    items: []
                };
            }

            if (row.order_item_id) {
                ordersMap[row.order_id].items.push({
                    order_item_id: row.order_item_id,
                    product_id: row.product_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    price: row.price,
                    image: row.image,
                    category: row.category,
                    brand: row.brand
                });
            }
        });

        const ordersList = Object.values(ordersMap);

        res.status(200).json({
            success: true,
            totalOrders: ordersList.length,
            data: ordersList
        });
    });
};

// =============================
// GET ALL ORDERS (Manager / Admin)
// =============================
const getAllOrders = (req, res) => {
    const { status } = req.query;

    let sql = `
        SELECT
            o.order_id,
            o.user_id,
            u.full_name,
            u.email,
            u.phone,
            u.address,
            o.total_amount,
            o.order_status,
            o.order_date,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS total_items
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
    `;

    const params = [];
    if (status && status !== "All") {
        sql += " WHERE o.order_status = ?";
        params.push(status);
    }

    sql += " ORDER BY o.order_id DESC";

    db.query(sql, params, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            totalOrders: result.length,
            data: result
        });
    });
};

// =============================
// UPDATE ORDER STATUS
// =============================
const updateOrderStatus = (req, res) => {
    const { id } = req.params;
    const { order_status } = req.body;

    if (!order_status) {
        return res.status(400).json({
            success: false,
            message: "Order status is required."
        });
    }

    const sql = "UPDATE orders SET order_status = ? WHERE order_id = ?";

    db.query(sql, [order_status, id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        res.status(200).json({
            success: true,
            message: `Order status updated to ${order_status}.`
        });
    });
};

// =============================
// CANCEL ORDER
// =============================
const cancelOrder = (req, res) => {
    const { id } = req.params;

    const checkSql = "SELECT order_status FROM orders WHERE order_id = ?";

    db.query(checkSql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        const currentStatus = result[0].order_status;

        if (currentStatus !== "Pending" && currentStatus !== "Confirmed") {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled because its status is ${currentStatus}.`
            });
        }

        const updateSql = "UPDATE orders SET order_status = 'Cancelled' WHERE order_id = ?";

        db.query(updateSql, [id], (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                message: "Order cancelled successfully."
            });
        });
    });
};

// =============================
// GET ORDER DETAILS
// =============================
const getOrderDetails = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            o.order_id,
            o.user_id,
            o.total_amount,
            o.order_status,
            o.order_date,
            u.full_name AS customer_name,
            u.email AS customer_email,
            u.phone AS customer_phone,
            u.address AS customer_address,
            oi.order_item_id,
            oi.product_id,
            oi.quantity,
            oi.price,
            p.product_name,
            p.description,
            p.category,
            p.brand,
            p.image
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE o.order_id = ?
    `;

    db.query(sql, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        const orderInfo = {
            order_id: rows[0].order_id,
            user_id: rows[0].user_id,
            customer_name: rows[0].customer_name,
            customer_email: rows[0].customer_email,
            customer_phone: rows[0].customer_phone,
            shipping_name: rows[0].customer_name,
            shipping_phone: rows[0].customer_phone,
            shipping_address: rows[0].customer_address,
            total_amount: rows[0].total_amount,
            final_amount: rows[0].total_amount,
            discount_amount: 0,
            order_status: rows[0].order_status,
            payment_method: "Verified UPI / Card / COD",
            order_date: rows[0].order_date,
            items: []
        };

        rows.forEach(r => {
            if (r.order_item_id) {
                orderInfo.items.push({
                    order_item_id: r.order_item_id,
                    product_id: r.product_id,
                    product_name: r.product_name,
                    description: r.description,
                    category: r.category,
                    brand: r.brand,
                    quantity: r.quantity,
                    price: r.price,
                    image: r.image
                });
            }
        });

        res.status(200).json({
            success: true,
            data: orderInfo
        });
    });
};

// =============================
// PURCHASE HISTORY
// =============================
const getPurchaseHistory = (req, res) => {
    const { user_id } = req.params;

    const sql = `
        SELECT
            o.order_id,
            o.total_amount,
            o.order_status,
            o.order_date,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS total_items
        FROM orders o
        WHERE o.user_id = ?
        ORDER BY o.order_date DESC
    `;

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            totalPurchases: result.length,
            data: result
        });
    });
};

module.exports = {
    placeOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getOrderDetails,
    getPurchaseHistory
};