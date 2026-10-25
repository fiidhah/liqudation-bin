const db = require("../config/db");

/**
 * Product Data Model
 * Handles database operations for liquidation items and inventory.
 */
class Product {
    /**
     * Find product by ID
     * @param {number} id 
     * @returns {Promise<object|null>}
     */
    static async findById(id) {
        const [rows] = await db.promise().query(
            "SELECT * FROM products WHERE product_id = ?",
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Get all products with optional category filtering
     * @param {string|null} category 
     * @returns {Promise<Array>}
     */
    static async getAll(category = null) {
        let sql = "SELECT * FROM products";
        const params = [];

        if (category && category !== "All") {
            sql += " WHERE category = ?";
            params.push(category);
        }

        sql += " ORDER BY product_id DESC";
        const [rows] = await db.promise().query(sql, params);
        return rows;
    }

    /**
     * Create a new product
     * @param {object} data - { manager_id, product_name, description, category, brand, price, quantity, image }
     * @returns {Promise<number>} Inserted product ID
     */
    static async create({
        manager_id = null,
        product_name,
        description = null,
        category = null,
        brand = null,
        price = 0,
        quantity = 0,
        image = null
    }) {
        const [result] = await db.promise().query(
            "INSERT INTO products (manager_id, product_name, description, category, brand, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [manager_id, product_name, description, category, brand, price, quantity, image]
        );
        return result.insertId;
    }

    /**
     * Update product details
     * @param {number} id 
     * @param {object} data - { product_name, description, category, brand, price, quantity, image }
     * @returns {Promise<boolean>}
     */
    static async update(id, { product_name, description, category, brand, price, quantity, image }) {
        let sql = "UPDATE products SET product_name = ?, description = ?, category = ?, brand = ?, price = ?, quantity = ?";
        const params = [product_name, description, category, brand, price, quantity];

        if (image) {
            sql += ", image = ?";
            params.push(image);
        }

        sql += " WHERE product_id = ?";
        params.push(id);

        const [result] = await db.promise().query(sql, params);
        return result.affectedRows > 0;
    }

    /**
     * Decrement or adjust product stock quantity
     * @param {number} id 
     * @param {number} quantityChange (negative to reduce stock)
     * @returns {Promise<boolean>}
     */
    static async updateStock(id, quantityChange) {
        const [result] = await db.promise().query(
            "UPDATE products SET quantity = GREATEST(0, quantity + ?) WHERE product_id = ?",
            [quantityChange, id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Search products across name, category, and brand
     * @param {string} query 
     * @returns {Promise<Array>}
     */
    static async search(query) {
        const searchPattern = `%${query}%`;
        const [rows] = await db.promise().query(
            "SELECT * FROM products WHERE product_name LIKE ? OR category LIKE ? OR brand LIKE ? ORDER BY product_id DESC",
            [searchPattern, searchPattern, searchPattern]
        );
        return rows;
    }

    /**
     * Delete product by ID
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
        const [result] = await db.promise().query(
            "DELETE FROM products WHERE product_id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Product;
