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
        const defaultImg = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";
        const previewEl = document.getElementById("imagePreview");
        if (previewEl) previewEl.src = defaultImg;
        const hiddenImg = document.getElementById("prodGeneratedImage");
        if (hiddenImg) hiddenImg.value = defaultImg;
        const badge = document.getElementById("imageSourceBadge");
        if (badge) {
            badge.textContent = "Ready to Generate";
            badge.className = "badge bg-danger-subtle text-danger px-2.5 py-1 rounded-pill";
        }
        const fileInput = document.getElementById("prodImageFile");
        if (fileInput) fileInput.value = "";
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
        const currentImg = p.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";
        const previewEl = document.getElementById("imagePreview");
        if (previewEl) previewEl.src = currentImg;
        const hiddenImg = document.getElementById("prodGeneratedImage");
        if (hiddenImg) hiddenImg.value = currentImg;
        const badge = document.getElementById("imageSourceBadge");
        if (badge) {
            badge.textContent = "Current Image";
            badge.className = "badge bg-secondary-subtle text-secondary px-2.5 py-1 rounded-pill";
        }
        const fileInput = document.getElementById("prodImageFile");
        if (fileInput) fileInput.value = "";

        new bootstrap.Modal(document.getElementById("productModal")).show();
    },

    handleImageFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            API.showToast("Please choose a valid image file (JPG, PNG, WEBP).", "warning");
            event.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewEl = document.getElementById("imagePreview");
            if (previewEl) previewEl.src = e.target.result;

            const badge = document.getElementById("imageSourceBadge");
            if (badge) {
                badge.textContent = "✅ Image Selected";
                badge.className = "badge bg-success-subtle text-success px-2.5 py-1 rounded-pill";
            }

            API.showToast("Image selected successfully: " + file.name, "success");
        };
        reader.readAsDataURL(file);
    },

    generateImageForProduct() {
        const nameInput = document.getElementById("prodName");
        const name = nameInput ? nameInput.value.trim() : "";
        const catInput = document.getElementById("prodCategory");
        const category = catInput ? catInput.value : "General";

        if (!name || name.length < 2) {
            API.showToast("Please enter a Product Title first so we can generate the right image.", "warning");
            if (nameInput) nameInput.focus();
            return;
        }

        const spinner = document.getElementById("imageGeneratingSpinner");
        if (spinner) spinner.classList.remove("d-none");

        const previewEl = document.getElementById("imagePreview");
        const hiddenInput = document.getElementById("prodGeneratedImage");
        const fileInput = document.getElementById("prodImageFile");
        const badge = document.getElementById("imageSourceBadge");

        // Clear local file input so generated image takes active role
        if (fileInput) fileInput.value = "";

        setTimeout(() => {
            const picked = this.pickImageForTitle(name, category);
            if (previewEl) previewEl.src = picked;
            if (hiddenInput) hiddenInput.value = picked;

            if (spinner) spinner.classList.add("d-none");

            if (badge) {
                badge.textContent = "✨ AI Generated";
                badge.className = "badge bg-primary-subtle text-primary px-2.5 py-1 rounded-pill";
            }

            API.showToast("✨ Generated product image for: " + name, "success");
        }, 250);
    },

    pickImageForTitle(title, category) {
        const t = (title || "").toLowerCase();
        const c = (category || "").toLowerCase();

        const pools = {
            headphone: [
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
                "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80",
                "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80"
            ],
            earbud: [
                "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
                "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80"
            ],
            watch: [
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
                "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80",
                "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80"
            ],
            phone: [
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
                "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80",
                "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80"
            ],
            ipad: [
                "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
                "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&q=80"
            ],
            tablet: [
                "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
                "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&q=80"
            ],
            laptop: [
                "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
                "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80"
            ],
            camera: [
                "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80",
                "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80"
            ],
            drone: [
                "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&q=80",
                "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&q=80"
            ],
            vacuum: [
                "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80",
                "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&q=80"
            ],
            robot: [
                "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80"
            ],
            speaker: [
                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80"
            ],
            saree: [
                "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
                "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"
            ],
            choker: [
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
                "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80"
            ],
            gold: [
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
                "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80"
            ],
            necklace: [
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80"
            ],
            chain: [
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80"
            ],
            dinner: [
                "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80",
                "https://images.unsplash.com/photo-1584990347449-399066668798?w=600&q=80"
            ],
            plate: [
                "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80"
            ],
            kitchen: [
                "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80",
                "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80"
            ],
            cookware: [
                "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&q=80"
            ],
            coffee: [
                "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&q=80"
            ],
            shoe: [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
                "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80"
            ],
            sneaker: [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
                "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80"
            ],
            boot: [
                "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80"
            ],
            drill: [
                "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80"
            ],
            tool: [
                "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&q=80",
                "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&q=80"
            ],
            car: [
                "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&q=80"
            ],
            toy: [
                "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&q=80",
                "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&q=80"
            ],
            buggy: [
                "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&q=80"
            ],
            keyboard: [
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80"
            ],
            mouse: [
                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80"
            ],
            chair: [
                "https://images.unsplash.com/photo-1580481077197-2a67a840e698?w=600&q=80"
            ],
            bag: [
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80"
            ]
        };

        const categoryPools = {
            "electronics": [
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
            ],
            "home & kitchen": [
                "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80",
                "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80",
                "https://images.unsplash.com/photo-1584990347449-399066668798?w=600&q=80"
            ],
            "fashion & footwear": [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
                "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80"
            ],
            "gadgets & office": [
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80"
            ],
            "tools & hardware": [
                "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
                "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&q=80"
            ]
        };

        for (const [kw, list] of Object.entries(pools)) {
            if (t.includes(kw)) {
                return list[Math.floor(Math.random() * list.length)];
            }
        }

        for (const [catKey, list] of Object.entries(categoryPools)) {
            if (c.includes(catKey)) {
                return list[Math.floor(Math.random() * list.length)];
            }
        }

        return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80";
    },

    async saveProduct() {
        const id = document.getElementById("productEditId").value;
        const name = document.getElementById("prodName").value.trim();
        const category = document.getElementById("prodCategory").value;
        const brand = document.getElementById("prodBrand").value.trim();
        const price = document.getElementById("prodPrice").value;
        const quantity = document.getElementById("prodQuantity").value;
        const desc = document.getElementById("prodDescription").value.trim();

        if (!name || name.length < 2) {
            API.showToast("Please enter a valid product title (minimum 2 characters).", "warning");
            document.getElementById("prodName").focus();
            return;
        }

        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice <= 0) {
            API.showToast("Please enter a valid positive price amount (e.g. 999.00).", "warning");
            document.getElementById("prodPrice").focus();
            return;
        }

        const numQty = parseInt(quantity);
        if (isNaN(numQty) || numQty < 0) {
            API.showToast("Please enter a valid non-negative stock quantity.", "warning");
            document.getElementById("prodQuantity").focus();
            return;
        }

        const user = Auth.getUser();

        try {
            const fileInput = document.getElementById("prodImageFile");
            const hasLocalFile = fileInput && fileInput.files && fileInput.files.length > 0;
            const hiddenGeneratedInput = document.getElementById("prodGeneratedImage");
            let finalImage = hiddenGeneratedInput ? hiddenGeneratedInput.value : "";

            // If a local image file is selected, upload it to server
            if (hasLocalFile) {
                const formData = new FormData();
                formData.append("image", fileInput.files[0]);
                const uploadRes = await API.post("/products/upload-image", formData);
                if (uploadRes && uploadRes.success && uploadRes.imageUrl) {
                    finalImage = uploadRes.imageUrl;
                }
            } else if (!finalImage) {
                finalImage = this.pickImageForTitle(name, category);
            }

            const payload = {
                manager_id: user ? (user.manager_id || 1) : 1,
                product_name: name,
                category: category || "General",
                brand: brand || "Generic",
                price: price,
                quantity: quantity,
                description: desc,
                image: finalImage || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
            };

            if (id) {
                await API.put(`/products/update/${id}`, payload);
                API.showToast("Product updated successfully in inventory!", "success");
            } else {
                await API.post("/products/add", payload);
                API.showToast("Product stocked successfully in database!", "success");
            }

            const modalInstance = bootstrap.Modal.getInstance(document.getElementById("productModal"));
            if (modalInstance) modalInstance.hide();
            await this.loadProducts();
            await this.loadKPIs();
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
                ManagerPortal.handleImageFileUpload(e);
            });
        }
    }
};

window.ManagerPortal = ManagerPortal;
document.addEventListener("DOMContentLoaded", () => {
    ManagerPortal.init();
});
