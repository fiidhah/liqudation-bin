const express = require("express");

const router = express.Router();

const {
    getAllProducts,
    addProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    updateProductPrice,
    searchProducts
} = require("../controllers/productController");

// =============================
// TEST ROUTE
// =============================
router.get("/test", (req, res) => {
    res.send("Product Route Working");
});

// =============================
// GET ALL PRODUCTS
// =============================
router.get("/", getAllProducts);

// =============================
// SEARCH PRODUCTS
// IMPORTANT: Must be before /:id
// =============================
router.get("/search", searchProducts);

// =============================
// GET PRODUCT BY ID
// =============================
router.get("/:id", getProductById);

// =============================
// ADD PRODUCT
// =============================
router.post("/add", addProduct);

// =============================
// UPDATE PRODUCT
// =============================
router.put("/update/:id", updateProduct);

// =============================
// DELETE PRODUCT
// =============================
router.delete("/delete/:id", deleteProduct);

// =============================
// UPDATE PRODUCT PRICE
// =============================
router.put("/update-price/:id", updateProductPrice);

module.exports = router;