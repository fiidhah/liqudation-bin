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
                            <img src="${imgSrc}" class="rounded-3 shadow-sm border" style="width: 50px; height: 50px; object-fit: contain; background: #F8FAFC; padding: 2px;"
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
                        <div class="fw-bold text-dark fs-6">₹${currPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
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
                            <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="ManagerPortal.openProductDailyPricesModal(${p.product_id})" title="Edit 7-Day Liquidation Schedule">
                                <i class="bi bi-calendar-week"></i> 7-Day Prices
                            </button>
                            <button class="btn btn-outline-secondary btn-sm rounded-pill" onclick="ManagerPortal.openEditProductModal(${p.product_id})" title="Edit Details">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="ManagerPortal.deleteProduct(${p.product_id})" title="Delete Product">
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
        const filterSelect = document.getElementById("filterProductDailyPriceSelect");

        const optionsHtml = this.products.map(p => `
            <option value="${p.product_id}">#PRD-${p.product_id}: ${p.product_name} (Current: ₹${Number(p.price).toFixed(2)})</option>
        `).join("");

        if (select) {
            select.innerHTML = optionsHtml;
        }

        if (filterSelect) {
            filterSelect.innerHTML = `
                <option value="All">All Products (Show Complete Database)</option>
                ${this.products.map(p => `
                    <option value="${p.product_id}">#PRD-${p.product_id}: ${p.product_name}</option>
                `).join("")}
            `;
        }
    },

    filterDailyPricesByProduct() {
        const filterSelect = document.getElementById("filterProductDailyPriceSelect");
        const btnEditFull = document.getElementById("btnEditFullSelectedProduct");
        const selectedValue = filterSelect ? filterSelect.value : "All";

        if (btnEditFull) {
            btnEditFull.style.display = selectedValue !== "All" ? "inline-block" : "none";
        }

        this.renderDailyPrices();
    },

    editSelectedProductSchedule() {
        const filterSelect = document.getElementById("filterProductDailyPriceSelect");
        const selectedValue = filterSelect ? filterSelect.value : "All";
        if (selectedValue !== "All") {
            this.openProductDailyPricesModal(selectedValue);
        }
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
        const countBadge = document.getElementById("dailyPricesCountBadge");
        if (!tbody) return;

        const filterSelect = document.getElementById("filterProductDailyPriceSelect");
        const selectedFilter = filterSelect ? filterSelect.value : "All";

        let displayedPrices = this.dailyPrices;
        if (selectedFilter !== "All") {
            displayedPrices = displayedPrices.filter(dp => String(dp.product_id) === String(selectedFilter));
        }

        if (countBadge) {
            countBadge.textContent = `${displayedPrices.length} schedules shown`;
        }

        if (displayedPrices.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center py-4">No daily price schedules found for the selected filter. Click "Auto-Generate 7-Day Drops for All" or use the form above to add prices.</td></tr>`;
            return;
        }

        const dayBadgeClasses = {
            Friday: "bg-dark",
            Saturday: "bg-primary",
            Sunday: "bg-primary",
            Monday: "bg-secondary",
            Tuesday: "bg-secondary",
            Wednesday: "bg-warning text-dark",
            Thursday: "bg-danger"
        };

        tbody.innerHTML = displayedPrices.map(dp => {
            const badgeClass = dayBadgeClasses[dp.day_name] || "bg-primary";
            const safeName = (dp.product_name || "Product").replace(/'/g, "\\'");

            return `
                <tr>
                    <td class="fw-bold text-muted">#DP-${dp.price_id}</td>
                    <td>
                        <div class="fw-bold text-dark">${dp.product_name}</div>
                        <small class="text-muted">${dp.brand || ''} • Base: ₹${Number(dp.base_price || dp.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</small>
                    </td>
                    <td>
                        <span class="badge ${badgeClass} px-3 py-2 rounded-pill fs-6">${dp.day_name}</span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <strong class="text-dark fs-5">₹${Number(dp.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex gap-1">
                            <button class="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold" onclick="ManagerPortal.editSingleDayPrice(${dp.price_id}, '${dp.day_name}', ${dp.price}, '${safeName}')" title="Edit ${dp.day_name}'s Price">
                                <i class="bi bi-pencil-fill me-1"></i> Edit Price
                            </button>
                            <button class="btn btn-outline-info btn-sm rounded-pill" onclick="ManagerPortal.openProductDailyPricesModal(${dp.product_id})" title="Edit All 7 Days">
                                <i class="bi bi-calendar3"></i> 7 Days
                            </button>
                            <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="ManagerPortal.deleteDailyPrice(${dp.price_id})" title="Delete Schedule">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    },

    async editSingleDayPrice(priceId, dayName, currentPrice, productName) {
        const { value: newPrice } = await Swal.fire({
            title: `Edit ${dayName} Price`,
            html: `Set new liquidation price for <strong>${productName}</strong> on <strong>${dayName}</strong>:`,
            input: 'number',
            inputValue: currentPrice,
            inputAttributes: {
                step: '0.01',
                min: '1'
            },
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-check2"></i> Save Price',
            confirmButtonColor: '#2563EB',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value || isNaN(value) || parseFloat(value) <= 0) {
                    return 'Please enter a valid price greater than ₹0';
                }
            }
        });

        if (newPrice !== undefined && newPrice !== null && newPrice !== "") {
            try {
                await API.put(`/daily-prices/update/${priceId}`, {
                    price: parseFloat(newPrice)
                });
                API.showToast(`Updated ${dayName}'s price for ${productName} to ₹${parseFloat(newPrice).toFixed(2)}`, "success");
                await this.loadProducts();
                await this.loadDailyPrices();
            } catch (e) {
                API.showToast(e.message || "Failed to update price.", "error");
            }
        }
    },

    async openProductDailyPricesModal(productId) {
        const p = this.products.find(item => item.product_id === parseInt(productId));
        if (!p) {
            API.showToast("Product not found.", "warning");
            return;
        }

        this.activeModalProduct = p;
        document.getElementById("modalDailyPriceProductId").value = p.product_id;
        document.getElementById("modalDailyPriceProductTitle").textContent = `Edit 7-Day Pricing: ${p.product_name}`;
        document.getElementById("modalDailyPriceProductSubtitle").textContent = `#PRD-${p.product_id} • ${p.brand || 'Generic'} • ${p.category || 'General'}`;
        document.getElementById("modalDailyPriceBaseDisplay").textContent = `₹${Number(p.base_price || p.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

        const base = Number(p.base_price || p.price) || 100;
        const mults = { Friday: 1.0, Saturday: 0.8, Sunday: 0.65, Monday: 0.5, Tuesday: 0.35, Wednesday: 0.25, Thursday: 0.15 };
        const weekly = Object.assign({}, p.weekly_prices || {});

        try {
            const res = await API.get(`/daily-prices/product/${p.product_id}`);
            if (res.success && res.data && res.data.length > 0) {
                res.data.forEach(dp => {
                    weekly[dp.day_name] = dp.price;
                });
            }
        } catch (e) {}

        const days = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        days.forEach(day => {
            const input = document.getElementById(`dayPrice_${day}`);
            if (input) {
                const val = weekly[day] !== undefined ? weekly[day] : Math.max(1, Math.round(base * mults[day]));
                input.value = Number(val).toFixed(2);
            }
        });

        new bootstrap.Modal(document.getElementById("editProductDailyPricesModal")).show();
    },

    autoFillStandardPercentages() {
        if (!this.activeModalProduct) return;
        const base = Number(this.activeModalProduct.base_price || this.activeModalProduct.price) || 100;
        const mults = { Friday: 1.0, Saturday: 0.8, Sunday: 0.65, Monday: 0.5, Tuesday: 0.35, Wednesday: 0.25, Thursday: 0.15 };

        Object.keys(mults).forEach(day => {
            const input = document.getElementById(`dayPrice_${day}`);
            if (input) {
                input.value = (Math.round(base * mults[day] * 100) / 100).toFixed(2);
            }
        });
        API.showToast("Recalculated standard markdown curve (100% down to 15%) based on Base Price!", "info");
    },

    async saveProductDailyPricesSchedule() {
        const productId = document.getElementById("modalDailyPriceProductId").value;
        if (!productId) return;

        const days = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const prices = {};

        for (const day of days) {
            const input = document.getElementById(`dayPrice_${day}`);
            if (!input || !input.value || isNaN(input.value) || parseFloat(input.value) <= 0) {
                API.showToast(`Please enter a valid positive price for ${day}`, "warning");
                return;
            }
            prices[day] = parseFloat(input.value);
        }

        try {
            const res = await API.post("/daily-prices/save-weekly", {
                product_id: parseInt(productId),
                prices
            });

            API.showToast(res.message || "7-Day liquidation prices saved successfully!", "success");
            bootstrap.Modal.getInstance(document.getElementById("editProductDailyPricesModal")).hide();
            await this.loadProducts();
            await this.loadDailyPrices();
        } catch (e) {
            API.showToast(e.message || "Failed to save weekly prices.", "error");
        }
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
            const res = await API.post("/daily-prices/add", {
                product_id: productId,
                day_name: dayName,
                price: parseFloat(price)
            });

            API.showToast(res.message || "Daily price override saved to database!", "success");
            document.getElementById("dailyPriceValue").value = "";
            await this.loadProducts();
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

    async autoGenerateDailyPrices() {
        try {
            API.showToast("Calculating and syncing 7-day liquidation prices for all products...", "info");
            const res = await API.post("/daily-prices/generate-all", {});
            API.showToast(res.message, "success");
            await this.loadProducts();
            await this.loadDailyPrices();
        } catch (e) {
            API.showToast(e.message || "Failed to auto-generate daily prices.", "error");
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
                    <td><strong class="text-dark fs-6">₹${Number(o.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></td>
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
