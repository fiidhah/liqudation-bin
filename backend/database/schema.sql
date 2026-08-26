-- SmartBin: Smart Liquidation Bin Store Database Schema

CREATE DATABASE IF NOT EXISTS smartbin_db;
USE smartbin_db;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Managers Table
CREATE TABLE IF NOT EXISTS managers (
    manager_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products Table (With Liquidation Bin Store Attributes)
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    manager_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'General',
    brand VARCHAR(100) DEFAULT 'Generic',
    bin_number VARCHAR(50) DEFAULT 'Bin A',
    condition_type ENUM('Brand New', 'Like New', 'Open Box', 'Refurbished', 'Clearance') DEFAULT 'Open Box',
    original_price DECIMAL(10, 2) DEFAULT 0.00,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    quantity INT NOT NULL DEFAULT 1,
    image VARCHAR(255) DEFAULT '/uploads/products/default.jpg',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES managers(manager_id) ON DELETE SET NULL
);

-- 5. Daily Price Schedule (Liquidation Bin Descending Daily Pricing)
CREATE TABLE IF NOT EXISTS daily_price_schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week INT NOT NULL UNIQUE, -- 0 = Sunday, 1 = Monday, ... 6 = Saturday
    day_name VARCHAR(20) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) DEFAULT 'Daily Liquidation Price Drop',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Cart Table
CREATE TABLE IF NOT EXISTS cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 7. Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 8. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    final_amount DECIMAL(10, 2) NOT NULL,
    order_status ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    shipping_name VARCHAR(100),
    shipping_phone VARCHAR(20),
    shipping_address TEXT,
    payment_method VARCHAR(50) DEFAULT 'Card / Online',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 9. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 10. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    razorpay_order_id VARCHAR(100) DEFAULT NULL,
    razorpay_payment_id VARCHAR(100) DEFAULT NULL,
    payment_method VARCHAR(50) DEFAULT 'Simulated Gateway',
    payment_status ENUM('Pending', 'Success', 'Failed') DEFAULT 'Success',
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 11. Promotional Offers Table
CREATE TABLE IF NOT EXISTS promotional_offers (
    offer_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Lucky Draws Table
CREATE TABLE IF NOT EXISTS lucky_draws (
    draw_id INT AUTO_INCREMENT PRIMARY KEY,
    draw_name VARCHAR(150) NOT NULL,
    prize VARCHAR(255) NOT NULL,
    draw_date DATE NOT NULL,
    description TEXT,
    status ENUM('Upcoming', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Lucky Draw Winners Table
CREATE TABLE IF NOT EXISTS lucky_draw_winners (
    winner_id INT AUTO_INCREMENT PRIMARY KEY,
    draw_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT DEFAULT NULL,
    prize_won VARCHAR(255) NOT NULL,
    announced_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (draw_id) REFERENCES lucky_draws(draw_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
