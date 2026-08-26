/**
 * SmartBin Manager Portal Controller (Products, Inventory, Daily Price Drops, Orders)
 */
const ManagerPortal = {
    products: [],
    orders: [],
    dailyPrices: [],

    async init() {
        if (!Auth.requireAuth(["Manager", "Admin"])) return;

        await this.loadProducts();
        await this.loadOrders();
        await this.loadDailyPrices();
        this.setupEventListeners();
    },

    // ==========================================
    // PRODUCTS & INVENTORY CRUD
    // ==========================================
    async loadProducts() {
        const tbody = document.getElementById("managerProductsTableBody");
        if (!tbody) return;

        try {
            const res = await API.get("/products");
            if (res.success) {
                this.products = res.data || [];
                this.renderProducts();
                this.updateInventoryKPIs();
                this.populateProductSelectForDailyPrice();
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-danger text-center">Error loading products: ${e.message}</td></tr>`;
        }
    },

    updateInventoryKPIs() {
        const totalProds = this.products.length;
        let totalStock = 0;
        let lowStockCount = 0;

        this.products.forEach(p => {
            totalStock += Number(p.quantity) || 0;
            if (p.quantity <= 5) lowStockCount++;
        });

        if (document.getElementById("mgrTotalProducts")) document.getElementById("mgrTotalProducts").textContent = totalProds;
        if (document.getElementById("mgrTotalStock")) document.getElementById("mgrTotalStock").textContent = totalStock;
        if (document.getElementById("mgrLowStock")) document.getElementById("mgrLowStock").textContent = lowStockCount;
    },

    renderProducts() {
        const tbody = document.getElementById("managerProductsTableBody");
        if (!tbody) return;

        if (this.products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center py-4">No products in liquidation bins. Click "Stock New Product" to add items.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.products.map(p => {
            const currPrice = Number(p.price);
            const isLowStock = p.quantity <= 5;
            const imgSrc = p.image && (p.image.startsWith("http") || p.image.startsWith("/uploads")) ? p.image : `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80`;

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <img src="${imgSrc}" class="rounded-3 shadow-sm" style="width: 50px; height: 50px; object-fit: cover;"
                                 onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'">
                            <div>
                                <h6 class="mb-0 fw-bold text-dark">${p.product_name}</h6>
                                <small class="text-muted">${p.brand || 'Generic'} • ${p.category || 'General'}</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge bg-dark">#PRD-${p.product_id}</span></td>
                    <td><span class="badge bg-primary-subtle text-primary">${p.category || 'General'}</span></td>
                    <td>
                        <div class="fw-bold text-danger fs-6">$${currPrice.toFixed(2)}</div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge ${isLowStock ? (p.quantity === 0 ? 'bg-danger' : 'bg-warning text-dark') : 'bg-success'}">
                                ${p.quantity} In Stock
                            </span>
                            <button class="btn btn-outline-secondary btn-sm py-0 px-2 rounded" onclick="ManagerPortal.quickUpdateStock(${p.product_id}, ${p.quantity})" title="Update Stock">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="ManagerPortal.openEditProductModal(${p.product_id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="ManagerPortal.deleteProduct(${p.product_id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    },

    openAddProductModal() {
        document.getElementById("productFormTitle").textContent = "Stock New Product into Liquidation Bin";
        document.getElementById("productForm").reset();
        document.getElementById("productEditId").value = "";
        document.getElementById("imagePreview").src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";
        new bootstrap.Modal(document.getElementById("productModal")).show();
    },

    openEditProductModal(id) {
        const p = this.products.find(item => item.product_id === id);
        if (!p) return;

        document.getElementById("productFormTitle").textContent = "Edit Product Details";
        document.getElementById("productEditId").value = p.product_id;
        document.getElementById("prodName").value = p.product_name;
        document.getElementById("prodCategory").value = p.category || "General";
        document.getElementById("prodBrand").value = p.brand || "";
        document.getElementById("prodPrice").value = p.price;
        document.getElementById("prodQuantity").value = p.quantity;
        document.getElementById("prodDescription").value = p.description || "";
        document.getElementById("imagePreview").src = p.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";

        new bootstrap.Modal(document.getElementById("productModal")).show();
    },

    async saveProduct() {
        const id = document.getElementById("productEditId").value;
        const name = document.getElementById("prodName").value.trim();
        const category = document.getElementById("prodCategory").value;
        const brand = document.getElementById("prodBrand").value.trim();
        const price = document.getElementById("prodPrice").value;
        const quantity = document.getElementById("prodQuantity").value;
        const desc = document.getElementById("prodDescription").value.trim();
        const imageFile = document.getElementById("prodImageFile").files[0];
        const imageUrlInput = document.getElementById("prodImageUrl").value.trim();

        if (!name || !price || quantity === "") {
            API.showToast("Product name, price and quantity are required.", "warning");
            return;
        }

        const user = Auth.getUser();

        try {
            let finalImage = imageUrlInput;

            if (imageFile) {
                const formData = new FormData();
                formData.append("image", imageFile);
                const uploadRes = await API.post("/products/upload-image", formData);
                if (uploadRes.success) {
                    finalImage = uploadRes.imageUrl;
                }
            }

            const payload = {
                manager_id: user ? (user.manager_id || 1) : 1,
                product_name: name,
                category: category || "General",
                brand: brand || "Generic",
                price: price,
                quantity: quantity,
                description: desc,
                image: finalImage || undefined
            };

            if (id) {
                await API.put(`/products/update/${id}`, payload);
                API.showToast("Product updated successfully!", "success");
            } else {
                await API.post("/products/add", payload);
                API.showToast("Product stocked successfully in database!", "success");
            }

            bootstrap.Modal.getInstance(document.getElementById("productModal")).hide();
            await this.loadProducts();
        } catch (e) {
            API.showToast(e.message || "Failed to save product.", "error");
        }
    },

    async quickUpdateStock(id, currentQty) {
        const newQtyStr = prompt("Enter new quantity in stock:", currentQty);
        if (newQtyStr === null) return;
        const newQty = parseInt(newQtyStr);
        if (isNaN(newQty) || newQty < 0) {
            API.showToast("Please enter a valid stock number.", "warning");
            return;
        }

        try {
            await API.put(`/products/update-stock/${id}`, { quantity: newQty });
            API.showToast("Inventory stock updated in database.", "success");
            await this.loadProducts();
        } catch (e) {
            API.showToast(e.message || "Failed to update stock.", "error");
        }
    },

    async deleteProduct(id) {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            await API.delete(`/products/delete/${id}`);
            API.showToast("Product removed from database.", "info");
            await this.loadProducts();
        } catch (e) {
            API.showToast(e.message || "Failed to delete product.", "error");
        }
    },

    // ==========================================
    // DAILY PRICE DROPS & SCHEDULE (daily_prices table)
    // ==========================================
    populateProductSelectForDailyPrice() {
        const select = document.getElementById("dailyPriceProductSelect");
        if (!select) return;

        select.innerHTML = this.products.map(p => `
            <option value="${p.product_id}">#PRD-${p.product_id}: ${p.product_name} (Current: $${Number(p.price).toFixed(2)})</option>
        `).join("");
    },

    async loadDailyPrices() {
        const tbody = document.getElementById("dailyPricesTableBody");
        if (!tbody) return;

        try {
            const res = await API.get("/daily-prices");
            if (res.success) {
                this.dailyPrices = res.data || [];
                this.renderDailyPrices();
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Failed to load daily prices: ${e.message}</td></tr>`;
        }
    },

    renderDailyPrices() {
        const tbody = document.getElementById("dailyPricesTableBody");
        if (!tbody) return;

        if (this.dailyPrices.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center py-4">No daily price schedules configured yet. Use the form above to add daily prices per day of the week.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.dailyPrices.map(dp => `
            <tr>
                <td class="fw-bold">#DP-${dp.price_id}</td>
                <td>
                    <div class="fw-bold text-dark">${dp.product_name}</div>
                    <small class="text-muted">${dp.brand || ''} • Base: $${Number(dp.base_price).toFixed(2)}</small>
                </td>
                <td><span class="badge bg-primary px-3 py-2 rounded-pill fs-6">${dp.day_name}</span></td>
                <td><strong class="text-danger fs-5">$${Number(dp.price).toFixed(2)}</strong></td>
                <td>
                    <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="ManagerPortal.deleteDailyPrice(${dp.price_id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    },

    async addDailyPriceSchedule() {
        const productId = document.getElementById("dailyPriceProductSelect").value;
        const dayName = document.getElementById("dailyPriceDaySelect").value;
        const price = document.getElementById("dailyPriceValue").value;

        if (!productId || !dayName || !price) {
            API.showToast("Please select product, day, and price.", "warning");
            return;
        }

        try {
            await API.post("/daily-prices/add", {
                product_id: productId,
                day_name: dayName,
                price: parseFloat(price)
            });

            API.showToast("Daily price override saved to database!", "success");
            document.getElementById("dailyPriceValue").value = "";
            await this.loadDailyPrices();
        } catch (e) {
            API.showToast(e.message || "Failed to add daily price.", "error");
        }
    },

    async deleteDailyPrice(priceId) {
        if (!confirm("Are you sure you want to remove this daily price schedule?")) return;

        try {
            await API.delete(`/daily-prices/delete/${priceId}`);
            API.showToast("Daily price schedule removed.", "info");
            await this.loadDailyPrices();
        } catch (e) {
            API.showToast(e.message || "Failed to delete.", "error");
        }
    },

    async applyTodayDailyPrices() {
        try {
            const res = await API.post("/daily-prices/apply-today", {});
            API.showToast(res.message, "success");
            await this.loadProducts();
        } catch (e) {
            API.showToast(e.message || "Failed to apply today's prices.", "error");
        }
    },

    // ==========================================
    // CUSTOMER ORDERS WORKFLOW MANAGEMENT
    // ==========================================
    async loadOrders() {
        const tbody = document.getElementById("mgrOrdersTableBody");
        if (!tbody) return;

        try {
            const res = await API.get("/orders/all");
            if (res.success) {
                this.orders = res.data || [];
                this.renderOrders();
                if (document.getElementById("mgrTotalOrders")) {
                    document.getElementById("mgrTotalOrders").textContent = this.orders.length;
                }
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-danger text-center">Failed to load orders: ${e.message}</td></tr>`;
        }
    },

    renderOrders() {
        const tbody = document.getElementById("mgrOrdersTableBody");
        if (!tbody) return;

        if (this.orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center py-4">No customer orders in database yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.orders.map(o => {
            return `
                <tr>
                    <td class="fw-bold">#SB-ORD-${o.order_id}</td>
                    <td>
                        <div class="fw-bold text-dark">${o.full_name}</div>
                        <small class="text-muted">${o.email} • ${o.phone || 'No phone'}</small>
                    </td>
                    <td>${new Date(o.order_date).toLocaleDateString()}</td>
                    <td><strong class="text-danger fs-6">$${Number(o.total_amount || 0).toFixed(2)}</strong></td>
                    <td>
                        <select class="form-select form-select-sm fw-bold rounded-pill" onchange="ManagerPortal.changeOrderStatus(${o.order_id}, this.value)" style="width: 140px;">
                            <option value="Pending" ${o.order_status === 'Pending' ? 'selected' : ''}>🟡 Pending</option>
                            <option value="Confirmed" ${o.order_status === 'Confirmed' ? 'selected' : ''}>🔵 Confirmed</option>
                            <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>🚚 Shipped</option>
                            <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>🟢 Delivered</option>
                            <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>🔴 Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <a href="/order-tracking.html?order_id=${o.order_id}" target="_blank" class="btn btn-outline-secondary btn-sm rounded-pill">
                            <i class="bi bi-eye"></i> Track
                        </a>
                    </td>
                </tr>
            `;
        }).join("");
    },

    async changeOrderStatus(orderId, newStatus) {
        try {
            await API.put(`/orders/update-status/${orderId}`, { order_status: newStatus });
            API.showToast(`Order #${orderId} updated to ${newStatus} in database!`, "success");
            await this.loadOrders();
        } catch (e) {
            API.showToast(e.message || "Failed to update order status.", "error");
        }
    },

    setupEventListeners() {
        document.querySelectorAll("[data-mgr-tab]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                document.querySelectorAll("[data-mgr-tab]").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                const target = btn.dataset.mgrTab;
                document.querySelectorAll(".mgr-tab-content").forEach(sec => sec.style.display = "none");
                const targetSec = document.getElementById(`mgr-tab-${target}`);
                if (targetSec) targetSec.style.display = "block";
            });
        });

        const fileInput = document.getElementById("prodImageFile");
        if (fileInput) {
            fileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        document.getElementById("imagePreview").src = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }
};

window.ManagerPortal = ManagerPortal;
document.addEventListener("DOMContentLoaded", () => {
    ManagerPortal.init();
});
