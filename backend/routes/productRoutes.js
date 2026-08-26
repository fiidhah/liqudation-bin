const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
    getAllProducts,
    addProduct,
    getProductById,
    updateProduct,
    updateStock,
    deleteProduct,
    updateProductPrice,
    searchProducts,
    uploadProductImage
} = require("../controllers/productController");

// Test Route
router.get("/test", (req, res) => {
    res.send("Product Route Working");
});

// Image Upload Route (Must be before /:id)
router.post("/upload-image", upload.single("image"), uploadProductImage);

// Search Products (Must be before /:id)
router.get("/search", searchProducts);

// Get All Products (supports query params: ?bin_number=Bin+A&category=Electronics&min_price=0&max_price=15&sort=savings)
router.get("/", getAllProducts);

// Get Product by ID
router.get("/:id", getProductById);

// Add Product
router.post("/add", upload.single("image"), addProduct);

// Update Product
router.put("/update/:id", updateProduct);

// Update Stock
router.put("/update-stock/:id", updateStock);

// Update Product Price
router.put("/update-price/:id", updateProductPrice);

// Delete Product
router.delete("/delete/:id", deleteProduct);

module.exports = router;