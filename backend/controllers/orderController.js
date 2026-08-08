const db = require("../config/db");

// =============================
// PLACE ORDER
// =============================
const placeOrder = (req, res) => {

    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            success: false,
            message: "User ID is required."
        });
    }

    // Get cart items with product price
    const cartSql = `
        SELECT
            c.product_id,
            c.quantity,
            p.price
        FROM cart c
        JOIN products p
        ON c.product_id = p.product_id
        WHERE c.user_id = ?
    `;

    db.query(cartSql, [user_id], (err, cartItems) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty."
            });
        }

        let totalAmount = 0;

        cartItems.forEach(item => {
            totalAmount += item.price * item.quantity;
        });

        const orderSql = `
            INSERT INTO orders
            (user_id, total_amount, order_status)
            VALUES (?, ?, ?)
        `;

        db.query(
            orderSql,
            [user_id, totalAmount, "Pending"],
            (err, orderResult) => {

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
                        [
                            orderId,
                            item.product_id,
                            item.quantity,
                            item.price
                        ],
                        (err) => {

                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });
                            }

                            completed++;

                            if (completed === cartItems.length) {

                                db.query(
                                    "DELETE FROM cart WHERE user_id = ?",
                                    [user_id]
                                );

                                res.status(201).json({
                                    success: true,
                                    message: "Order placed successfully.",
                                    orderId,
                                    totalAmount
                                });

                            }

                        }
                    );

                });

            }
        );

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
            o.total_amount,
            o.order_status,
            o.order_date,
            oi.order_item_id,
            oi.product_id,
            oi.quantity,
            oi.price,
            p.product_name,
            p.image
        FROM orders o
        JOIN order_items oi
            ON o.order_id = oi.order_id
        JOIN products p
            ON oi.product_id = p.product_id
        WHERE o.user_id = ?
        ORDER BY o.order_id DESC
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
            totalOrders: result.length,
            data: result
        });

    });

};
// =============================
// GET ALL ORDERS
// =============================
const getAllOrders = (req, res) => {

    const sql = `
        SELECT
            o.order_id,
            o.user_id,
            u.full_name,
            u.email,
            o.total_amount,
            o.order_status,
            o.order_date
        FROM orders o
        JOIN users u
            ON o.user_id = u.user_id
        ORDER BY o.order_id DESC
    `;

    db.query(sql, (err, result) => {

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

    const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled"
    ];

    if (!allowedStatuses.includes(order_status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order status."
        });
    }

    const sql = `
        UPDATE orders
        SET order_status = ?
        WHERE order_id = ?
    `;

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
            message: "Order status updated successfully."
        });

    });

};
// =============================
// CANCEL ORDER
// =============================
const cancelOrder = (req, res) => {

    const { id } = req.params;

    // First check the current order status
    const checkSql = `
        SELECT order_status
        FROM orders
        WHERE order_id = ?
    `;

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

        // Only Pending or Confirmed orders can be cancelled
        if (
            currentStatus !== "Pending" &&
            currentStatus !== "Confirmed"
        ) {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled because its status is ${currentStatus}.`
            });
        }

        const updateSql = `
            UPDATE orders
            SET order_status = 'Cancelled'
            WHERE order_id = ?
        `;

        db.query(updateSql, [id], (err, result) => {

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

        JOIN order_items oi
            ON o.order_id = oi.order_id

        JOIN products p
            ON oi.product_id = p.product_id

        WHERE o.order_id = ?
    `;

    db.query(sql, [id], (err, result) => {

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

        res.status(200).json({
            success: true,
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
    getOrderDetails
};