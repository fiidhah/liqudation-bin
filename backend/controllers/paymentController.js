const db = require("../config/db");

// =============================
// PROCESS PAYMENT
// =============================
const makePayment = (req, res) => {
    const { order_id, user_id, payment_method } = req.body;

    if (!order_id || !user_id) {
        return res.status(400).json({
            success: false,
            message: "Order ID and User ID are required."
        });
    }

    const orderSql = "SELECT * FROM orders WHERE order_id = ? AND user_id = ?";

    db.query(orderSql, [order_id, user_id], (err, orders) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        const order = orders[0];
        const dummyOrderId = "razorpay_order_" + Date.now();
        const dummyPaymentId = "pay_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

        const paymentSql = `
            INSERT INTO payments
            (order_id, user_id, razorpay_order_id, razorpay_payment_id, payment_status, amount)
            VALUES (?, ?, ?, ?, 'Success', ?)
        `;

        db.query(
            paymentSql,
            [
                order_id,
                user_id,
                dummyOrderId,
                dummyPaymentId,
                order.total_amount || 0.00
            ],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                // Update order status to Confirmed
                db.query("UPDATE orders SET order_status = 'Confirmed' WHERE order_id = ?", [order_id], (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: "🎉 Payment processed successfully!",
                        paymentId: result.insertId,
                        transactionId: dummyPaymentId,
                        orderId: order_id,
                        amount: order.total_amount,
                        status: "Success",
                        paymentDate: new Date()
                    });
                });
            }
        );
    });
};

// =============================
// GET PAYMENT BY ORDER ID
// =============================
const getPaymentByOrderId = (req, res) => {
    const { order_id } = req.params;

    const sql = "SELECT * FROM payments WHERE order_id = ?";

    db.query(sql, [order_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No payment record found for this order."
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    });
};

module.exports = {
    makePayment,
    getPaymentByOrderId
};