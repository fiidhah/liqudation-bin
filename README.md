# SMARTBIN – SMART LIQUIDATION BIN STORE E-COMMERCE MANAGEMENT SYSTEM

A full-featured Liquidation Bin Store E-Commerce Web Application built with **HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5, Node.js, Express.js, and MySQL (`liquidation_bin`)**.

---

## 🚀 How to Run the Project

1. Make sure MySQL is running on your machine with database `liquidation_bin`.
2. In the project folder, run:
   ```bash
   node server.js
   ```
3. Open your browser and visit:
   - **Storefront**: [http://localhost:3000](http://localhost:3000)
   - **Store Manager Portal**: [http://localhost:3000/manager/index.html](http://localhost:3000/manager/index.html)
   - **Admin Dashboard**: [http://localhost:3000/admin/index.html](http://localhost:3000/admin/index.html)

---

## 🗄️ MySQL Database Schema (`liquidation_bin`)

All 15 tables in your MySQL database are directly connected and used:

1. **`admins`**: `admin_id`, `full_name`, `email`, `password`, `phone`, `created_at`
2. **`managers`**: `manager_id`, `full_name`, `email`, `password`, `phone`, `address`, `created_at`
3. **`users`**: `user_id`, `full_name`, `email`, `password`, `phone`, `address`, `created_at`
4. **`products`**: `product_id`, `manager_id`, `product_name`, `description`, `category`, `brand`, `price`, `quantity`, `image`, `created_at`
5. **`daily_prices`**: `price_id`, `product_id`, `day_name` (`Monday`...`Sunday`), `price`, `updated_at`
6. **`cart`**: `cart_id`, `user_id`, `product_id`, `quantity`, `created_at`
7. **`cart_items`**: `cart_item_id`, `cart_id`, `product_id`, `quantity`
8. **`wishlist`**: `wishlist_id`, `user_id`, `product_id`, `created_at`
9. **`orders`**: `order_id`, `user_id`, `total_amount`, `order_status`, `order_date`
10. **`order_items`**: `order_item_id`, `order_id`, `product_id`, `quantity`, `price`
11. **`payments`**: `payment_id`, `order_id`, `user_id`, `razorpay_order_id`, `razorpay_payment_id`, `payment_status`, `amount`, `payment_date`
12. **`offers`**: `offer_id`, `title`, `description`, `discount_percentage`, `start_date`, `end_date`
13. **`promotional_offers`**: `offer_id`, `title`, `description`, `discount_percentage`, `start_date`, `end_date`, `status`, `created_at`
14. **`lucky_draws`**: `draw_id`, `draw_name`, `draw_date`, `description`
15. **`winners`**: `winner_id`, `draw_id`, `user_id`, `announced_at`

---

## 🔑 Login Credentials

| Role | Email | Password | Access Link |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@gmail.com` | `admin123` | [Admin Portal](http://localhost:3000/admin/index.html) |
| **Store Manager** | `manager@gmail.com` | `123456` | [Manager Portal](http://localhost:3000/manager/index.html) |
| **Customer** | `fidha@gmail.com` | `user123` | [Login Page](http://localhost:3000/login.html) |
