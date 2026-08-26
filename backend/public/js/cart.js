/**
 * SmartBin Cart Controller
 */
const CartPage = {
    cartItems: [],
    appliedCoupon: null,
    totalAmount: 0,
    totalOriginal: 0,

    async init() {
        if (!Auth.requireAuth(["User", "Manager", "Admin"])) return;
        
        // Restore saved coupon if available
        const savedCoupon = localStorage.getItem("smartbin_active_coupon");
        if (savedCoupon) {
            try {
                this.appliedCoupon = JSON.parse(savedCoupon);
            } catch (e) {
                this.appliedCoupon = null;
            }
        }

        await this.loadCart();
        this.setupCouponListener();
    },

    async loadCart() {
        const user = Auth.getUser();
        const container = document.getElementById("cartItemsContainer");
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">Loading your cart items...</p>
            </div>
        `;

        try {
            const res = await API.get(`/cart/${user.user_id}`);
            if (res.success) {
                this.cartItems = res.data || [];
                this.totalAmount = Number(res.totalAmount) || 0;
                this.totalOriginal = Number(res.totalOriginal) || 0;
                this.renderCart();
                this.updateSummary();
            }
        } catch (e) {
            container.innerHTML = `
                <div class="alert alert-danger">Error loading cart: ${e.message}</div>
            `;
        }
    },

    renderCart() {
        const container = document.getElementById("cartItemsContainer");
        const checkoutBtn = document.getElementById("checkoutButton");
        if (!container) return;

        if (this.cartItems.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="card p-5 border-0 shadow-sm rounded-4 text-center">
                        <i class="bi bi-cart-x fs-1 text-muted mb-3"></i>
                        <h4 class="fw-bold">Your Liquidation Cart is Empty</h4>
                        <p class="text-muted">Explore our daily bins and grab high-value overstock before it sells out!</p>
                        <a href="/products.html" class="btn btn-primary-custom px-4 py-2 rounded-pill mx-auto mt-2">
                            <i class="bi bi-search me-1"></i> Browse Products
                        </a>
                    </div>
                </div>
            `;
            if (checkoutBtn) checkoutBtn.classList.add("disabled");
            return;
        }

        if (checkoutBtn) checkoutBtn.classList.remove("disabled");

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead class="table-light text-uppercase small text-muted">
                        <tr>
                            <th>Product</th>
                            <th>Bin & Condition</th>
                            <th>Unit Price</th>
                            <th style="width: 140px;">Quantity</th>
                            <th>Total</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.cartItems.map(item => {
                            const itemTotal = Number(item.price) * item.quantity;
                            const origPrice = Number(item.original_price || item.price);
                            return `
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-3">
                                            <img src="${item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}" 
                                                 class="rounded-3 shadow-sm" style="width: 60px; height: 60px; object-fit: cover;"
                                                 onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'">
                                            <div>
                                                <h6 class="fw-bold mb-0 text-dark">${item.product_name}</h6>
                                                <small class="text-muted">${item.brand || 'Brand'} • ${item.category || 'Category'}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge bg-dark">${item.bin_number || 'Bin A'}</span>
                                        <span class="badge bg-primary-subtle text-primary">${item.condition_type || 'Open Box'}</span>
                                    </td>
                                    <td>
                                        <div class="fw-bold text-danger">$${Number(item.price).toFixed(2)}</div>
                                        ${origPrice > item.price ? `
                                            <small class="text-muted text-decoration-line-through">$${origPrice.toFixed(2)}</small>
                                        ` : ''}
                                    </td>
                                    <td>
                                        <div class="input-group input-group-sm">
                                            <button class="btn btn-outline-secondary" onclick="CartPage.updateQuantity(${item.cart_id}, ${item.quantity - 1})">-</button>
                                            <input type="text" class="form-control text-center fw-bold" value="${item.quantity}" readonly>
                                            <button class="btn btn-outline-secondary" onclick="CartPage.updateQuantity(${item.cart_id}, ${item.quantity + 1})">+</button>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="fw-black fs-6 text-dark">$${itemTotal.toFixed(2)}</div>
                                    </td>
                                    <td>
                                        <button class="btn btn-outline-danger btn-sm rounded-circle" onclick="CartPage.deleteItem(${item.cart_id})" title="Remove">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-3">
                <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="CartPage.clearCart()">
                    <i class="bi bi-trash3 me-1"></i> Clear Cart
                </button>
                <a href="/products.html" class="btn btn-outline-secondary btn-sm rounded-pill">
                    <i class="bi bi-arrow-left me-1"></i> Continue Shopping
                </a>
            </div>
        `;
    },

    updateSummary() {
        const subtotalEl = document.getElementById("cartSubtotal");
        const discountEl = document.getElementById("cartDiscount");
        const savingsEl = document.getElementById("cartSavings");
        const totalEl = document.getElementById("cartFinalTotal");
        const couponBadge = document.getElementById("appliedCouponBadge");

        if (!subtotalEl) return;

        let discountAmount = 0;
        if (this.appliedCoupon && this.totalAmount > 0) {
            discountAmount = (this.totalAmount * Number(this.appliedCoupon.discount_percentage)) / 100;
        }

        const finalTotal = Math.max(0, this.totalAmount - discountAmount);
        const totalSavings = Math.max(0, this.totalOriginal - finalTotal);

        subtotalEl.textContent = `$${this.totalAmount.toFixed(2)}`;
        discountEl.textContent = `-$${discountAmount.toFixed(2)}`;
        totalEl.textContent = `$${finalTotal.toFixed(2)}`;

        if (savingsEl) {
            savingsEl.textContent = `$${totalSavings.toFixed(2)}`;
        }

        if (couponBadge) {
            if (this.appliedCoupon) {
                couponBadge.innerHTML = `
                    <span class="badge bg-success px-3 py-2 rounded-pill d-flex align-items-center gap-2">
                        <i class="bi bi-tag-fill"></i> Coupon "${this.appliedCoupon.code}" applied (-${this.appliedCoupon.discount_percentage}%)
                        <a href="javascript:void(0)" onclick="CartPage.removeCoupon()" class="text-white ms-2 text-decoration-none">✕</a>
                    </span>
                `;
            } else {
                couponBadge.innerHTML = "";
            }
        }
    },

    async updateQuantity(cartId, newQuantity) {
        if (newQuantity <= 0) {
            return this.deleteItem(cartId);
        }

        try {
            await API.put(`/cart/update/${cartId}`, { quantity: newQuantity });
            await this.loadCart();
            Auth.updateCartBadge();
        } catch (e) {
            API.showToast(e.message || "Failed to update quantity", "error");
        }
    },

    async deleteItem(cartId) {
        try {
            await API.delete(`/cart/delete/${cartId}`);
            API.showToast("Item removed from cart.", "info");
            await this.loadCart();
            Auth.updateCartBadge();
        } catch (e) {
            API.showToast(e.message || "Failed to remove item", "error");
        }
    },

    async clearCart() {
        if (!confirm("Are you sure you want to clear your cart?")) return;
        const user = Auth.getUser();

        try {
            await API.delete(`/cart/clear/${user.user_id}`);
            API.showToast("Cart cleared.", "info");
            await this.loadCart();
            Auth.updateCartBadge();
        } catch (e) {
            API.showToast(e.message || "Failed to clear cart", "error");
        }
    },

    setupCouponListener() {
        const applyBtn = document.getElementById("applyCouponBtn");
        const couponInput = document.getElementById("couponCodeInput");

        if (applyBtn && couponInput) {
            applyBtn.addEventListener("click", async () => {
                const code = couponInput.value.trim();
                if (!code) {
                    API.showToast("Please enter a valid promo code.", "warning");
                    return;
                }

                try {
                    const res = await API.post("/offers/validate", {
                        code: code,
                        order_amount: this.totalAmount
                    });

                    if (res.success && res.coupon) {
                        this.appliedCoupon = res.coupon;
                        localStorage.setItem("smartbin_active_coupon", JSON.stringify(res.coupon));
                        API.showToast(res.message, "success");
                        couponInput.value = "";
                        this.updateSummary();
                    }
                } catch (e) {
                    API.showToast(e.message || "Invalid coupon code.", "error");
                }
            });
        }
    },

    removeCoupon() {
        this.appliedCoupon = null;
        localStorage.removeItem("smartbin_active_coupon");
        API.showToast("Coupon removed.", "info");
        this.updateSummary();
    },

    proceedToCheckout() {
        if (this.cartItems.length === 0) {
            API.showToast("Your cart is empty!", "warning");
            return;
        }
        window.location.href = "/checkout.html";
    }
};

window.CartPage = CartPage;
document.addEventListener("DOMContentLoaded", () => {
    CartPage.init();
});
