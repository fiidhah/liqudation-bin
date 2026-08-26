/**
 * SmartBin Storefront & Product Catalog Interactions
 */
const App = {
    products: [],
    priceSchedule: [],
    todaySchedule: null,
    activeFilters: {
        keyword: "",
        category: "All",
        bin_number: "All",
        condition_type: "All",
        sort: "latest"
    },

    async init() {
        await this.loadDailyPriceSchedule();
        await this.loadProducts();
        this.setupEventListeners();
    },

    async loadDailyPriceSchedule() {
        try {
            const [scheduleRes, todayRes] = await Promise.all([
                API.get("/daily-prices/schedule"),
                API.get("/daily-prices/today")
            ]);

            if (scheduleRes.success) {
                this.priceSchedule = scheduleRes.data;
                this.renderScheduleTimeline();
            }

            if (todayRes.success && todayRes.todaySchedule) {
                this.todaySchedule = todayRes.todaySchedule;
                this.renderTodayPriceBanner();
            }
        } catch (e) {
            console.error("Could not load price schedule:", e);
        }
    },

    renderTodayPriceBanner() {
        const bannerContainer = document.getElementById("todayPriceBanner");
        if (!bannerContainer || !this.todaySchedule) return;

        const dayName = this.todaySchedule.day_name || "Today";
        const price = Number(this.todaySchedule.price).toFixed(2);
        const desc = this.todaySchedule.description || "Daily Liquidation Drop";

        bannerContainer.innerHTML = `
            <div class="row align-items-center">
                <div class="col-lg-7 text-center text-lg-start mb-4 mb-lg-0">
                    <span class="badge bg-light text-dark px-3 py-2 rounded-pill fw-bold text-uppercase mb-2">
                        <i class="bi bi-clock-history me-1"></i> Today's Bin Deal: ${dayName}
                    </span>
                    <h1 class="display-5 fw-black text-white mb-2">Everything in Today's Bins Is Only</h1>
                    <p class="lead text-white-50 mb-3">${desc} — Unbox premium brand returns, overstock & clearance electronics, tools, home goods and more!</p>
                    <div class="d-flex flex-wrap gap-2 justify-content-center justify-content-lg-start">
                        <a href="/products.html" class="btn btn-light btn-lg px-4 py-2 rounded-pill fw-bold shadow">
                            <i class="bi bi-bag-check-fill me-2 text-danger"></i> Hunt The Bins Now
                        </a>
                        <a href="/lucky-draw.html" class="btn btn-outline-light btn-lg px-4 py-2 rounded-pill fw-bold">
                            <i class="bi bi-gift-fill me-2 text-warning"></i> Weekend Lucky Draw
                        </a>
                    </div>
                </div>
                <div class="col-lg-5 text-center">
                    <div class="today-price-badge">
                        <span class="fs-4 text-muted">$</span>${price}
                        <span class="fs-6 text-dark fw-bold text-uppercase d-block d-md-inline ms-md-2">Flat Rate</span>
                    </div>
                    <p class="text-white-50 small mt-2"><i class="bi bi-arrow-down-circle me-1"></i> Price drops daily! Restock every Friday.</p>
                </div>
            </div>
        `;
    },

    renderScheduleTimeline() {
        const container = document.getElementById("weeklyScheduleContainer");
        if (!container || !this.priceSchedule.length) return;

        const todayDayOfWeek = new Date().getDay();

        container.innerHTML = this.priceSchedule.map(item => {
            const isToday = item.day_of_week === todayDayOfWeek;
            return `
                <div class="col">
                    <div class="schedule-card ${isToday ? 'today' : ''}">
                        <div class="small fw-bold text-uppercase">${item.day_name.substring(0, 3)}</div>
                        <div class="fs-4 fw-black my-1">$${Number(item.price).toFixed(0)}</div>
                        <div class="small text-truncate" title="${item.description}">${isToday ? '🔥 TODAY' : 'Drop'}</div>
                    </div>
                </div>
            `;
        }).join("");
    },

    async loadProducts() {
        const grid = document.getElementById("productGrid");
        if (!grid) return;

        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading bins...</span>
                </div>
                <p class="mt-2 text-muted">Searching liquidation bins...</p>
            </div>
        `;

        try {
            const res = await API.get("/products", this.activeFilters);
            if (res.success) {
                this.products = res.data;
                this.renderProducts();
            }
        } catch (e) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">Failed to load products: ${e.message}</div>
                </div>
            `;
        }
    },

    renderProducts() {
        const grid = document.getElementById("productGrid");
        const countSpan = document.getElementById("productsCount");
        if (!grid) return;

        if (countSpan) {
            countSpan.textContent = `Showing ${this.products.length} liquidation bin items`;
        }

        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="card p-5 border-0 shadow-sm rounded-4 text-center">
                        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
                        <h4 class="fw-bold">No Products Found in This Bin</h4>
                        <p class="text-muted">Try changing your search terms or bin filters.</p>
                        <button class="btn btn-outline-custom mx-auto mt-2" onclick="App.resetFilters()">Reset All Filters</button>
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.products.map(p => {
            const origPrice = Number(p.original_price || p.price);
            const currPrice = Number(p.price);
            const savings = Math.max(0, origPrice - currPrice);
            const savingsPercent = origPrice > 0 ? Math.round((savings / origPrice) * 100) : 0;

            const conditionClass = "condition-" + (p.condition_type || "open-box").toLowerCase().replace(" ", "-");
            const isOutOfStock = p.quantity <= 0;

            return `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div class="product-card">
                        <div class="product-img-wrapper">
                            <span class="bin-tag"><i class="bi bi-archive-fill me-1"></i>${p.bin_number || 'Bin A'}</span>
                            <span class="condition-badge ${conditionClass}">${p.condition_type || 'Open Box'}</span>
                            <img src="${p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}" 
                                 alt="${p.product_name}" 
                                 class="product-img" 
                                 onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'">
                        </div>
                        <div class="card-body p-3 d-flex flex-direction-column justify-content-between flex-grow-1">
                            <div>
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="text-muted small text-uppercase fw-bold">${p.category || 'General'}</span>
                                    <span class="badge ${p.quantity > 5 ? 'bg-success-subtle text-success' : (p.quantity > 0 ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger')} small">
                                        ${p.quantity > 0 ? `${p.quantity} In Bin` : 'Sold Out'}
                                    </span>
                                </div>
                                <h6 class="card-title fw-bold text-dark text-truncate-2 mb-2" title="${p.product_name}" style="height: 2.8rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                    ${p.product_name}
                                </h6>
                            </div>

                            <div class="pt-2 border-top">
                                <div class="d-flex align-items-baseline mb-2">
                                    <span class="price-current">$${currPrice.toFixed(2)}</span>
                                    ${origPrice > currPrice ? `
                                        <span class="price-original">$${origPrice.toFixed(2)}</span>
                                        <span class="savings-pill ms-auto">Save ${savingsPercent}%</span>
                                    ` : ''}
                                </div>

                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary-custom btn-sm rounded-pill d-flex align-items-center justify-content-center gap-1"
                                            onclick="App.addToCart(${p.product_id})"
                                            ${isOutOfStock ? 'disabled' : ''}>
                                        <i class="bi bi-cart-plus"></i> ${isOutOfStock ? 'Out of Stock' : 'Grab This Deal'}
                                    </button>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-outline-secondary btn-sm rounded-pill w-100" onclick="App.openQuickView(${p.product_id})">
                                            <i class="bi bi-eye"></i> Details
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm rounded-pill px-3" onclick="App.addToWishlist(${p.product_id})" title="Add to Wishlist">
                                            <i class="bi bi-heart"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    },

    async openQuickView(productId) {
        try {
            const res = await API.get(`/products/${productId}`);
            if (!res.success || !res.data) return;

            const p = res.data;
            const modalEl = document.getElementById("productQuickViewModal");
            const modalBody = document.getElementById("quickViewModalBody");
            if (!modalEl || !modalBody) return;

            const origPrice = Number(p.original_price || p.price);
            const currPrice = Number(p.price);
            const savings = Math.max(0, origPrice - currPrice);
            const savingsPercent = origPrice > 0 ? Math.round((savings / origPrice) * 100) : 0;

            modalBody.innerHTML = `
                <div class="row g-4">
                    <div class="col-md-6 text-center">
                        <img src="${p.image}" class="img-fluid rounded-4 shadow-sm" style="max-height: 320px; object-fit: contain;">
                        <div class="d-flex justify-content-center gap-2 mt-3">
                            <span class="badge bg-dark px-3 py-2 fs-6 rounded-pill"><i class="bi bi-archive me-1"></i>Location: ${p.bin_number || 'Bin A'}</span>
                            <span class="badge bg-primary px-3 py-2 fs-6 rounded-pill">${p.condition_type || 'Open Box'}</span>
                        </div>
                    </div>
                    <div class="col-md-6 d-flex flex-column justify-content-between">
                        <div>
                            <span class="text-muted text-uppercase fw-bold small">${p.brand || 'Brand'} • ${p.category || 'Category'}</span>
                            <h4 class="fw-bold mt-1 mb-2">${p.product_name}</h4>
                            
                            <div class="d-flex align-items-baseline gap-2 mb-3">
                                <span class="display-6 fw-black text-danger">$${currPrice.toFixed(2)}</span>
                                <span class="fs-5 text-muted text-decoration-line-through">$${origPrice.toFixed(2)}</span>
                                <span class="badge bg-success-subtle text-success fs-6 rounded-pill px-3">You Save $${savings.toFixed(2)} (${savingsPercent}%)</span>
                            </div>

                            <p class="text-secondary">${p.description || 'Verified liquidation overstock inventory item. Inspected and ready for fast delivery.'}</p>
                            
                            <ul class="list-unstyled text-muted small my-3">
                                <li><i class="bi bi-check-circle-fill text-success me-2"></i> Stock Available: <strong>${p.quantity} units</strong></li>
                                <li><i class="bi bi-check-circle-fill text-success me-2"></i> Quality Inspected: <strong>${p.condition_type}</strong></li>
                                <li><i class="bi bi-check-circle-fill text-success me-2"></i> Eligible for Weekend Lucky Draw entry</li>
                            </ul>
                        </div>

                        <div class="d-grid gap-2 mt-3">
                            <button class="btn btn-primary-custom btn-lg rounded-pill" onclick="App.addToCart(${p.product_id})" ${p.quantity <= 0 ? 'disabled' : ''}>
                                <i class="bi bi-cart-plus-fill me-2"></i> Add to Cart Now
                            </button>
                            <button class="btn btn-outline-danger rounded-pill" onclick="App.addToWishlist(${p.product_id})">
                                <i class="bi bi-heart me-2"></i> Save to Wishlist
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const bsModal = new bootstrap.Modal(modalEl);
            bsModal.show();
        } catch (e) {
            API.showToast("Could not load product details", "error");
        }
    },

    async addToCart(productId, quantity = 1) {
        if (!Auth.isLoggedIn()) {
            API.showToast("Please login to add items to your cart.", "info");
            setTimeout(() => {
                window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
            }, 1200);
            return;
        }

        const user = Auth.getUser();
        try {
            const res = await API.post("/cart/add", {
                user_id: user.user_id,
                product_id: productId,
                quantity: quantity
            });

            if (res.success) {
                API.showToast("Item added to your liquidation haul cart! 🛒", "success");
                Auth.updateCartBadge();
            }
        } catch (e) {
            API.showToast(e.message || "Failed to add item to cart.", "error");
        }
    },

    async addToWishlist(productId) {
        if (!Auth.isLoggedIn()) {
            API.showToast("Please login to save items to your wishlist.", "info");
            return;
        }

        const user = Auth.getUser();
        try {
            const res = await API.post("/wishlist/add", {
                user_id: user.user_id,
                product_id: productId
            });

            if (res.success) {
                API.showToast("Saved to your wishlist! ❤️", "success");
            }
        } catch (e) {
            API.showToast(e.message || "Failed to save to wishlist.", "warning");
        }
    },

    setupEventListeners() {
        const searchInput = document.getElementById("searchProductsInput");
        if (searchInput) {
            let timeout;
            searchInput.addEventListener("input", (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.activeFilters.keyword = e.target.value;
                    this.loadProducts();
                }, 350);
            });
        }

        // Bin filter buttons
        document.querySelectorAll("[data-filter-bin]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                document.querySelectorAll("[data-filter-bin]").forEach(b => b.classList.remove("active", "btn-primary"));
                btn.classList.add("active");
                this.activeFilters.bin_number = btn.dataset.filterBin;
                this.loadProducts();
            });
        });

        // Category filter
        const catSelect = document.getElementById("categoryFilter");
        if (catSelect) {
            catSelect.addEventListener("change", (e) => {
                this.activeFilters.category = e.target.value;
                this.loadProducts();
            });
        }

        // Condition filter
        const condSelect = document.getElementById("conditionFilter");
        if (condSelect) {
            condSelect.addEventListener("change", (e) => {
                this.activeFilters.condition_type = e.target.value;
                this.loadProducts();
            });
        }

        // Sort filter
        const sortSelect = document.getElementById("sortFilter");
        if (sortSelect) {
            sortSelect.addEventListener("change", (e) => {
                this.activeFilters.sort = e.target.value;
                this.loadProducts();
            });
        }
    },

    resetFilters() {
        this.activeFilters = {
            keyword: "",
            category: "All",
            bin_number: "All",
            condition_type: "All",
            sort: "latest"
        };
        const searchInput = document.getElementById("searchProductsInput");
        if (searchInput) searchInput.value = "";
        this.loadProducts();
    }
};

window.App = App;
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
