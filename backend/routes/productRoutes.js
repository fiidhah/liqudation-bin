const express = require("express");

const router = express.Router();

const {
    getAllProducts,
    addProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    updateProductPrice
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