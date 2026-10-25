/**
 * SmartBin Standard Storefront & Catalog Controller (Indian Rupees ₹ & Dynamic Daily Pricing)
 */
const App = {
    products: [],
    priceSchedule: [],
    todaySchedule: null,
    activeDay: "Today",
    activeFilters: {
        keyword: "",
        category: "All",
        min_price: "",
        max_price: "",
        sort: "latest",
        day: ""
    },

    async init() {
        const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        this.todayDayName = daysArr[new Date().getDay()];
        this.activeDay = this.todayDayName;

        const dayDisplay = document.getElementById("heroTodayDayDisplay");
        if (dayDisplay) dayDisplay.textContent = this.activeDay;

        this.startDealCountdown();
        await this.loadDailyPriceSchedule();
        await this.loadProducts();
        this.setupEventListeners();
    },

    async loadDailyPriceSchedule() {
        try {
            const todayRes = await API.get("/daily-prices/today");
            if (todayRes.success && todayRes.data && todayRes.data.length > 0) {
                this.todaySchedule = todayRes.data[0];
                const heroDisplay = document.getElementById("heroPriceDisplay");
                if (heroDisplay) {
                    heroDisplay.textContent = Number(this.todaySchedule.price).toLocaleString("en-IN");
                }
            }
            this.renderScheduleTimeline();
        } catch (e) {
            console.error("Could not load price schedule:", e);
        }
    },

    selectDay(dayName) {
        if (this.activeFilters.day === dayName) {
            this.activeFilters.day = "";
            this.activeDay = this.todayDayName;
        } else {
            this.activeFilters.day = dayName;
            this.activeDay = dayName;
        }
        this.renderScheduleTimeline();
        this.loadProducts();

        API.showToast(`Viewing liquidation prices for: ${this.activeDay}`, "info");
    },

    renderScheduleTimeline() {
        const container = document.getElementById("weeklyScheduleContainer");
        if (!container) return;

        const days = [
            { day: "Friday", price: 2499, desc: "Restock" },
            { day: "Saturday", price: 1999, desc: "Weekend" },
            { day: "Sunday", price: 1499, desc: "Drop" },
            { day: "Monday", price: 999, desc: "Markdown" },
            { day: "Tuesday", price: 699, desc: "Value" },
            { day: "Wednesday", price: 399, desc: "Blowout" },
            { day: "Thursday", price: 199, desc: "Clearance" }
        ];

        const activeDayName = this.activeDay || this.todayDayName;

        container.innerHTML = days.map(item => {
            const isSelected = item.day.toLowerCase() === activeDayName.toLowerCase();
            const isToday = item.day.toLowerCase() === this.todayDayName.toLowerCase();

            return `
                <div class="col" style="cursor: pointer;" onclick="App.selectDay('${item.day}')" title="Click to view all products at ${item.day}'s liquidated prices">
                    <div class="schedule-card ${isSelected ? 'today border border-primary shadow' : ''}" style="transition: transform 0.2s ease;">
                        <div class="day-title fw-bold">${item.day.substring(0, 3)}</div>
                        <div class="price-number text-primary">₹${item.price}</div>
                        <span class="status-pill ${isSelected ? 'bg-primary text-white fw-bold' : (isToday ? 'bg-info text-white' : 'bg-light text-muted')}">
                            ${isSelected ? (isToday ? 'Today (Active)' : 'Selected') : (isToday ? 'Today' : item.desc)}
                        </span>
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
                <div class="spinner-border text-dark" role="status"></div>
                <p class="mt-3 text-muted">Calculating daily liquidation prices for ${this.activeDay}...</p>
            </div>
        `;

        try {
            const res = await API.get("/products", this.activeFilters);
            if (res.success) {
                this.products = res.data || [];
                if (res.activeDay) this.activeDay = res.activeDay;

                const dayDisplay = document.getElementById("heroTodayDayDisplay");
                if (dayDisplay) dayDisplay.textContent = this.activeDay;

                this.syncEditorialShowcase();
                this.renderProducts();
            }
        } catch (e) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-secondary rounded-3">Failed to load products: ${e.message}</div>
                </div>
            `;
        }
    },

    syncEditorialShowcase() {
        if (!this.products || this.products.length === 0) return;

        const getValidImg = (img) => {
            if (img && (img.startsWith("http") || img.startsWith("/uploads"))) return img;
            return "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80";
        };

        // 1. Hero Main Product Stage
        const heroProduct = this.products.find(p => p.product_id === 8) || this.products[0];
        const heroMainImg = document.getElementById("heroMainProductImg");
        if (heroMainImg && heroProduct) {
            heroMainImg.src = getValidImg(heroProduct.image);
            heroMainImg.alt = heroProduct.product_name;
        }

        // 2. Floating Hero Badges
        const p1 = this.products.find(p => p.product_id === 8) || this.products[0];
        const f1Title = document.getElementById("heroFloatTitle1");
        const f1Price = document.getElementById("heroFloatPrice1");
        const f1Img = document.getElementById("heroFloatImg1");
        const f1Card = document.getElementById("heroFloatCard1");
        if (p1) {
            if (f1Title) f1Title.textContent = p1.product_name;
            if (f1Price) f1Price.textContent = `₹${Number(p1.price).toLocaleString("en-IN")}`;
            if (f1Img) f1Img.src = getValidImg(p1.image);
            if (f1Card) f1Card.onclick = () => App.openQuickView(p1.product_id);
        }

        const p2 = this.products.find(p => p.product_id === 7) || this.products[1] || p1;
        const f2Title = document.getElementById("heroFloatTitle2");
        const f2Price = document.getElementById("heroFloatPrice2");
        const f2Img = document.getElementById("heroFloatImg2");
        const f2Card = document.getElementById("heroFloatCard2");
        if (p2) {
            if (f2Title) f2Title.textContent = p2.product_name;
            if (f2Price) f2Price.textContent = `₹${Number(p2.price).toLocaleString("en-IN")}`;
            if (f2Img) f2Img.src = getValidImg(p2.image);
            if (f2Card) f2Card.onclick = () => App.openQuickView(p2.product_id);
        }

        // 3. Center Featured Best Seller Tall Card
        const centerProd = this.products.find(p => p.product_id === 8) || this.products[0];
        const cImg = document.getElementById("centerFeaturedImg");
        const cTitle = document.getElementById("centerFeaturedTitle");
        const cPrice = document.getElementById("centerFeaturedPrice");
        const cCard = document.getElementById("centerFeaturedCard");
        if (centerProd) {
            if (cImg) cImg.src = getValidImg(centerProd.image);
            if (cTitle) cTitle.textContent = centerProd.product_name;
            if (cPrice) cPrice.textContent = `₹${Number(centerProd.price).toLocaleString("en-IN")}`;
            if (cCard) cCard.onclick = () => App.openQuickView(centerProd.product_id);
        }

        // 4. 4 Best Seller Cards (Left 2, Right 2)
        const candidateIds = [7, 9, 21, 20];
        for (let i = 0; i < 4; i++) {
            const p = this.products.find(prod => prod.product_id === candidateIds[i]) || this.products[i % this.products.length];
            if (!p) continue;
            const titleEl = document.getElementById(`bestSellerTitle${i + 1}`);
            const priceEl = document.getElementById(`bestSellerPrice${i + 1}`);
            const imgEl = document.getElementById(`bestSellerImg${i + 1}`);
            const cardEl = document.getElementById(`bestSellerCard${i + 1}`);
            if (titleEl) titleEl.textContent = p.product_name;
            if (priceEl) priceEl.textContent = `₹${Number(p.price).toLocaleString("en-IN")}`;
            if (imgEl) imgEl.src = getValidImg(p.image);
            if (cardEl) cardEl.onclick = () => App.openQuickView(p.product_id);
        }

        // 5. Deal of the Month Spotlight
        const dealProd = this.products.find(p => p.product_id === 9) || this.products[1] || this.products[0];
        const dealImg = document.getElementById("dealMonthImg");
        const dealTitle = document.getElementById("dealMonthTitle");
        if (dealProd) {
            if (dealImg) dealImg.src = getValidImg(dealProd.image);
            if (dealTitle) dealTitle.textContent = `${dealProd.product_name} - Flat ₹${Number(dealProd.price).toLocaleString("en-IN")}`;
        }
    },

    startDealCountdown() {
        let totalSecs = 4 * 86400 + 18 * 3600 + 42 * 60 + 15;
        const daysEl = document.getElementById("dealCountdownDays");
        const hoursEl = document.getElementById("dealCountdownHours");
        const minsEl = document.getElementById("dealCountdownMins");
        const secsEl = document.getElementById("dealCountdownSecs");

        if (!secsEl) return;

        setInterval(() => {
            if (totalSecs > 0) totalSecs--;
            const d = Math.floor(totalSecs / 86400);
            const h = Math.floor((totalSecs % 86400) / 3600);
            const m = Math.floor((totalSecs % 3600) / 60);
            const s = totalSecs % 60;

            if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
            if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
            if (minsEl) minsEl.textContent = String(m).padStart(2, '0');
            if (secsEl) secsEl.textContent = String(s).padStart(2, '0');
        }, 1000);
    },

    renderProducts() {
        const grid = document.getElementById("productGrid");
        const countSpan = document.getElementById("productsCount");
        if (!grid) return;

        if (countSpan) {
            const dayLabel = this.activeDay ? `(${this.activeDay}'s Liquidation Deals)` : "";
            countSpan.textContent = `Showing ${this.products.length} Liquidation Items ${dayLabel}`;
        }

        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="card p-5 border-0 shadow-sm rounded-3 text-center bg-white">
                        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
                        <h5 class="fw-bold">No Products Found</h5>
                        <p class="text-muted small">Try adjusting your filters or search query.</p>
                        <button class="btn btn-outline-custom mx-auto mt-2" onclick="App.resetFilters()">Reset Filters</button>
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.products.map(p => {
            const currPrice = Number(p.price);
            const basePrice = Number(p.base_price || p.price);
            const isDiscounted = basePrice > currPrice;
            const isOutOfStock = p.quantity <= 0;
            const imgSrc = p.image && (p.image.startsWith("http") || p.image.startsWith("/uploads")) ? p.image : `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80`;
            const activeDayName = p.active_day || this.activeDay;

            return `
                <div class="col-12 col-sm-6 col-md-4 col-lg-4">
                    <div class="product-card h-100 d-flex flex-column border rounded-3 overflow-hidden shadow-sm">
                        <div class="product-img-wrapper position-relative">
                            <span class="bin-tag badge bg-dark position-absolute top-0 start-0 m-2" style="z-index: 5;">#PRD-${p.product_id}</span>
                            <span class="condition-badge badge bg-primary position-absolute top-0 end-0 m-2" style="z-index: 5;">${activeDayName}'s Price</span>
                            <img src="${imgSrc}" 
                                 alt="${p.product_name}" 
                                 class="product-img" 
                                 style="max-height: 195px; max-width: 100%; object-fit: contain;"
                                 onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'">
                        </div>
                        <div class="p-3 d-flex flex-column justify-content-between flex-grow-1 bg-white">
                            <div>
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="text-muted small text-uppercase fw-semibold">${p.brand || 'Generic'} • ${p.category || 'General'}</span>
                                    <span class="badge ${p.quantity > 5 ? 'bg-light text-dark border' : 'bg-secondary-subtle text-secondary'} small">
                                        ${p.quantity > 0 ? `${p.quantity} In Stock` : 'Sold Out'}
                                    </span>
                                </div>
                                <h6 class="card-title fw-bold text-dark text-truncate-2 mb-2" title="${p.product_name}" style="height: 2.8rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                    ${p.product_name}
                                </h6>
                            </div>

                            <div class="pt-2 border-top mt-auto">
                                <div class="d-flex align-items-baseline justify-content-between mb-2">
                                    <div>
                                        <span class="fs-4 fw-bold text-dark">₹${currPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                        ${isDiscounted ? `<small class="text-muted text-decoration-line-through ms-2">₹${basePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</small>` : ''}
                                    </div>
                                    <span class="badge bg-success-subtle text-success border border-success-subtle small">${activeDayName} Deal</span>
                                </div>

                                <!-- 7-Day Prices Quick Link -->
                                <div class="mb-3">
                                    <button class="btn btn-sm btn-link text-decoration-none p-0 text-primary small fw-semibold" onclick="App.openQuickView(${p.product_id})">
                                        <i class="bi bi-calendar3 me-1"></i> View 7-Day Price Drops
                                    </button>
                                </div>

                                <div class="d-grid gap-2">
                                    <!-- Buy Now Button -->
                                    <button class="btn btn-dark btn-sm fw-bold"
                                            onclick="App.buyNow(${p.product_id})"
                                            ${isOutOfStock ? 'disabled' : ''}>
                                        <i class="bi bi-lightning-charge-fill text-warning me-1"></i> ${isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                                    </button>

                                    <!-- Add to Cart and Details Buttons -->
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-outline-dark btn-sm w-100"
                                                onclick="App.addToCart(${p.product_id})"
                                                ${isOutOfStock ? 'disabled' : ''}>
                                            <i class="bi bi-cart-plus me-1"></i> Cart
                                        </button>
                                        <button class="btn btn-outline-secondary btn-sm" onclick="App.openQuickView(${p.product_id})" title="Details">
                                            <i class="bi bi-eye"></i> Details
                                        </button>
                                        <button class="btn btn-outline-secondary btn-sm px-2" onclick="App.addToWishlist(${p.product_id})" title="Wishlist">
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
            const res = await API.get(`/products/${productId}?day=${this.activeDay || ''}`);
            if (!res.success || !res.data) return;

            const p = res.data;
            const modalBody = document.getElementById("quickViewModalBody");
            if (!modalBody) return;

            const currPrice = Number(p.price);
            const basePrice = Number(p.base_price || p.price);
            const imgSrc = p.image && (p.image.startsWith("http") || p.image.startsWith("/uploads")) ? p.image : `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80`;
            const activeDayName = p.active_day || this.activeDay || this.todayDayName;

            const weeklyScheduleDays = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
            const weeklyPrices = p.weekly_prices || {};

            const scheduleHtml = weeklyScheduleDays.map(day => {
                const dayPrice = weeklyPrices[day] !== undefined ? weeklyPrices[day] : currPrice;
                const isSelected = day.toLowerCase() === activeDayName.toLowerCase();
                return `
                    <div class="col text-center">
                        <div class="p-2 rounded ${isSelected ? 'bg-primary text-white shadow-sm fw-bold' : 'bg-white border text-dark'}">
                            <div style="font-size: 11px; text-transform: uppercase;">${day.substring(0, 3)}</div>
                            <div class="fw-bold mt-1" style="font-size: 13px;">₹${Number(dayPrice).toLocaleString("en-IN")}</div>
                            ${isSelected ? '<span class="badge bg-white text-primary mt-1" style="font-size: 9px;">Active</span>' : ''}
                        </div>
                    </div>
                `;
            }).join("");

            modalBody.innerHTML = `
                <div class="row g-4 p-2">
                    <div class="col-md-5 text-center">
                        <div class="p-3 bg-light rounded-3 d-flex align-items-center justify-content-center mb-3" style="min-height: 240px; background: #F8FAFC !important;">
                            <img src="${imgSrc}" class="img-fluid rounded-2" style="max-height: 220px; max-width: 100%; object-fit: contain;" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'">
                        </div>
                        <div class="d-flex justify-content-center gap-2">
                            <span class="badge bg-dark px-3 py-2">#PRD-${p.product_id}</span>
                            <span class="badge bg-secondary px-3 py-2">${p.category || 'General'}</span>
                        </div>
                    </div>
                    <div class="col-md-7 d-flex flex-column justify-content-between">
                        <div>
                            <span class="text-muted text-uppercase fw-semibold small">${p.brand || 'Brand'} • ${p.category || 'Category'}</span>
                            <h4 class="fw-bold mt-1 mb-2">${p.product_name}</h4>
                            
                            <div class="d-flex align-items-baseline gap-2 mb-2">
                                <span class="fs-2 fw-bold text-dark">₹${currPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                <span class="badge bg-primary text-white">${activeDayName}'s Price</span>
                                ${basePrice > currPrice ? `<span class="text-muted text-decoration-line-through small">Base: ₹${basePrice.toLocaleString("en-IN")}</span>` : ''}
                            </div>

                            <!-- 7-Day Liquidation Schedule for THIS product -->
                            <div class="my-3 p-3 bg-light rounded-3 border">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="fw-bold mb-0 text-dark small"><i class="bi bi-calendar-week me-1 text-primary"></i> 7-Day Liquidation Price Drops</h6>
                                    <span class="text-muted small" style="font-size: 11px;">Prices drop daily</span>
                                </div>
                                <div class="row g-1">
                                    ${scheduleHtml}
                                </div>
                            </div>

                            <p class="text-secondary small mb-3">${p.description || 'Inspected and certified liquidation overstock inventory.'}</p>
                        </div>

                        <div class="pt-3 border-top">
                            <div class="d-flex align-items-center gap-2 mb-3">
                                <span class="text-muted small fw-semibold">Quantity Available:</span>
                                <span class="badge bg-light text-dark border px-2 py-1">${p.quantity} units</span>
                            </div>
                            <div class="d-grid gap-2">
                                <button class="btn btn-dark btn-lg fw-bold" onclick="App.buyNow(${p.product_id}); bootstrap.Modal.getInstance(document.getElementById('productQuickViewModal')).hide();" ${p.quantity <= 0 ? 'disabled' : ''}>
                                    <i class="bi bi-lightning-charge-fill text-warning me-1"></i> Buy Now Directly
                                </button>
                                <button class="btn btn-outline-dark" onclick="App.addToCart(${p.product_id}); bootstrap.Modal.getInstance(document.getElementById('productQuickViewModal')).hide();" ${p.quantity <= 0 ? 'disabled' : ''}>
                                    <i class="bi bi-cart-plus me-1"></i> Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            new bootstrap.Modal(document.getElementById("productQuickViewModal")).show();
        } catch (e) {
            API.showToast("Could not load product details.", "error");
        }
    },

    // ==========================================
    // INSTANT BUY NOW HANDLER
    // ==========================================
    async buyNow(productId) {
        if (!Auth.isLoggedIn()) {
            API.showToast("Please sign in to complete your instant order.", "info");
            setTimeout(() => {
                window.location.href = `/login.html?redirect=${encodeURIComponent('/checkout.html?buy_now=' + productId)}`;
            }, 1000);
            return;
        }

        const user = Auth.getUser();
        try {
            await API.post("/cart/add", {
                user_id: user.user_id,
                product_id: productId,
                quantity: 1
            });
            Auth.updateCartBadge();

            window.location.href = `/checkout.html?buy_now=${productId}`;
        } catch (e) {
            API.showToast(e.message || "Failed to proceed to checkout.", "error");
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
                API.showToast("Item added to cart at today's deal price.", "success");
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
                API.showToast("Saved to your wishlist.", "success");
            }
        } catch (e) {
            API.showToast(e.message || "Failed to save to wishlist.", "warning");
        }
    },

    setupEventListeners() {
        const searchInput = document.getElementById("searchInput");
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

        const categorySelect = document.getElementById("categorySelect");
        if (categorySelect) {
            categorySelect.addEventListener("change", (e) => {
                this.activeFilters.category = e.target.value;
                this.loadProducts();
            });
        }

        document.querySelectorAll("#categoryChips button").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll("#categoryChips button").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.activeFilters.category = btn.dataset.cat;
                if (categorySelect) categorySelect.value = btn.dataset.cat;
                this.loadProducts();
            });
        });

        const sortSelect = document.getElementById("sortSelect");
        if (sortSelect) {
            sortSelect.addEventListener("change", (e) => {
                this.activeFilters.sort = e.target.value;
                this.loadProducts();
            });
        }

        const minPriceInput = document.getElementById("minPriceInput");
        if (minPriceInput) {
            minPriceInput.addEventListener("change", (e) => {
                this.activeFilters.min_price = e.target.value;
                this.loadProducts();
            });
        }

        const maxPriceInput = document.getElementById("maxPriceInput");
        if (maxPriceInput) {
            maxPriceInput.addEventListener("change", (e) => {
                this.activeFilters.max_price = e.target.value;
                this.loadProducts();
            });
        }

        const newsletterForm = document.getElementById("newsletterForm");
        if (newsletterForm) {
            newsletterForm.addEventListener("submit", (e) => this.handleSubscribe(e));
        }
        const btnSubscribe = document.getElementById("btnSubscribe");
        if (btnSubscribe && !newsletterForm) {
            btnSubscribe.addEventListener("click", (e) => this.handleSubscribe(e));
        }
    },

    async handleSubscribe(e) {
        if (e && typeof e.preventDefault === "function") {
            e.preventDefault();
        }

        const input = document.getElementById("newsletterEmail");
        if (!input) return;

        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            Swal.fire({
                icon: "warning",
                title: "Invalid Email Address",
                text: "Please enter a valid email address (e.g. name@example.com) to receive restock alerts.",
                confirmButtonColor: "#0F172A"
            });
            input.focus();
            return;
        }

        const btn = document.getElementById("btnSubscribe");
        const originalText = btn ? btn.innerHTML : "Subscribe";
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Subscribing...`;
        }

        try {
            // Local client-side storage persistence
            const subscribers = JSON.parse(localStorage.getItem("smartbin_newsletter_subscribers") || "[]");
            if (!subscribers.includes(email.toLowerCase())) {
                subscribers.push(email.toLowerCase());
                localStorage.setItem("smartbin_newsletter_subscribers", JSON.stringify(subscribers));
            }

            // Backend API registration
            try {
                await API.post("/newsletter/subscribe", { email });
            } catch (apiErr) {
                console.warn("Newsletter API notice:", apiErr.message);
            }

            // Clear input
            input.value = "";

            // Show confirmation alert
            Swal.fire({
                icon: "success",
                title: "Subscribed Successfully! 🎉",
                html: `
                    <p class="mb-2">You're on the VIP list for <b>SmartBin Restock Alerts</b>!</p>
                    <p class="text-muted small mb-3">You will receive early notifications every Friday as new liquidation inventory drops.</p>
                    <div class="p-2 rounded bg-light border text-dark fw-bold">${email}</div>
                `,
                confirmButtonText: "Great, Got It!",
                confirmButtonColor: "#0F172A"
            });

            if (typeof API.showToast === "function") {
                API.showToast("Subscribed! Friday restock alerts enabled.", "success");
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Subscription Error",
                text: error.message || "Failed to process subscription. Please try again.",
                confirmButtonColor: "#0F172A"
            });
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    },

    resetFilters() {
        this.activeFilters = {
            keyword: "",
            category: "All",
            min_price: "",
            max_price: "",
            sort: "latest",
            day: ""
        };
        this.activeDay = this.todayDayName;
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = "";
        const categorySelect = document.getElementById("categorySelect");
        if (categorySelect) categorySelect.value = "All";
        const sortSelect = document.getElementById("sortSelect");
        if (sortSelect) sortSelect.value = "latest";
        const minPriceInput = document.getElementById("minPriceInput");
        if (minPriceInput) minPriceInput.value = "";
        const maxPriceInput = document.getElementById("maxPriceInput");
        if (maxPriceInput) maxPriceInput.value = "";
        this.renderScheduleTimeline();
        this.loadProducts();
    }
};

window.App = App;
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
