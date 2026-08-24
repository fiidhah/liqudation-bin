const db = require("../config/db");

// =============================
// DUMMY PAYMENT
// =============================
const makeDummyPayment = (req, res) => {

    const { order_id, user_id } = req.body;

    if (!order_id || !user_id) {
        return res.status(400).json({
            success: false,
            message: "Order ID and User ID are required."
        });
    }

    // Get order details
    const orderSql = `
        SELECT *
        FROM orders
        WHERE order_id = ?
        AND user_id = ?
    `;

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

        // Generate dummy payment IDs
        const dummyOrderId =
            "order_dummy_" + Date.now();

        const dummyPaymentId =
            "pay_dummy_" + Date.now();

        // Insert payment record
        const paymentSql = `
            INSERT INTO payments
            (
                order_id,
                user_id,
                razorpay_order_id,
                razorpay_payment_id,
                payment_status,
                amount
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
            paymentSql,
            [
                order_id,
                user_id,
                dummyOrderId,
                dummyPaymentId,
                "Success",
                order.total_amount
            ],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                // Update order status
                const updateOrderSql = `
                    UPDATE orders
                    SET order_status = 'Confirmed'
                    WHERE order_id = ?
                `;

                db.query(
                    updateOrderSql,
                    [order_id],
                    (err) => {

                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });
                        }

                        res.status(200).json({
                            success: true,
                            message: "Payment successful.",
                            paymentId: result.insertId,
                            transactionId: dummyPaymentId,
                            amount: order.total_amount
                        });

                    }
                );

            }
        );

    });

};

module.exports = {
    makeDummyPayment
};