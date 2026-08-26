/**
 * SmartBin Checkout & Payment Simulator Controller
 */
const CheckoutPage = {
    cartItems: [],
    appliedCoupon: null,
    totalAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
    createdOrderId: null,

    async init() {
        if (!Auth.requireAuth(["User", "Manager", "Admin"])) return;
        
        // Restore coupon
        const savedCoupon = localStorage.getItem("smartbin_active_coupon");
        if (savedCoupon) {
            try { this.appliedCoupon = JSON.parse(savedCoupon); } catch(e) {}
        }

        this.prefillUserInfo();
        await this.loadCheckoutSummary();
        this.setupEventListeners();
    },

    prefillUserInfo() {
        const user = Auth.getUser();
        if (!user) return;

        const nameInput = document.getElementById("shippingName");
        const emailInput = document.getElementById("shippingEmail");
        const phoneInput = document.getElementById("shippingPhone");
        const addressInput = document.getElementById("shippingAddress");

        if (nameInput) nameInput.value = user.full_name || "";
        if (emailInput) emailInput.value = user.email || "";
        if (phoneInput && user.phone) phoneInput.value = user.phone;
        if (addressInput && user.address) addressInput.value = user.address;
    },

    async loadCheckoutSummary() {
        const user = Auth.getUser();
        const itemsContainer = document.getElementById("checkoutItemsList");
        if (!itemsContainer) return;

        try {
            const res = await API.get(`/cart/${user.user_id}`);
            if (!res.success || !res.data || res.data.length === 0) {
                API.showToast("Your cart is empty. Redirecting...", "info");
                setTimeout(() => window.location.href = "/products.html", 1500);
                return;
            }

            this.cartItems = res.data;
            this.totalAmount = Number(res.totalAmount) || 0;

            if (this.appliedCoupon) {
                this.discountAmount = (this.totalAmount * Number(this.appliedCoupon.discount_percentage)) / 100;
            }

            this.finalAmount = Math.max(0, this.totalAmount - this.discountAmount);

            // Render items list
            itemsContainer.innerHTML = this.cartItems.map(item => `
                <li class="list-group-item d-flex justify-content-between align-items-center lh-sm py-3">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${item.image}" class="rounded-3" style="width: 45px; height: 45px; object-fit: cover;">
                        <div>
                            <h6 class="my-0 text-dark fw-bold">${item.product_name}</h6>
                            <small class="text-muted">Qty: ${item.quantity} • ${item.bin_number} • ${item.condition_type}</small>
                        </div>
                    </div>
                    <span class="text-dark fw-bold">$${(item.price * item.quantity).toFixed(2)}</span>
                </li>
            `).join("");

            // Update price labels
            document.getElementById("checkoutSubtotal").textContent = `$${this.totalAmount.toFixed(2)}`;
            document.getElementById("checkoutDiscount").textContent = `-$${this.discountAmount.toFixed(2)}`;
            document.getElementById("checkoutFinalTotal").textContent = `$${this.finalAmount.toFixed(2)}`;

            if (this.appliedCoupon) {
                document.getElementById("checkoutCouponNotice").innerHTML = `
                    <div class="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-0">
                        <i class="bi bi-tag-fill"></i> Coupon <strong>${this.appliedCoupon.code}</strong> Applied (-${this.appliedCoupon.discount_percentage}%)
                    </div>
                `;
            }
        } catch (e) {
            console.error("Error loading checkout summary:", e);
        }
    },

    setupEventListeners() {
        const checkoutForm = document.getElementById("checkoutForm");
        if (checkoutForm) {
            checkoutForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.placeOrderAndOpenPayment();
            });
        }
    },

    async placeOrderAndOpenPayment() {
        const user = Auth.getUser();
        const name = document.getElementById("shippingName").value.trim();
        const phone = document.getElementById("shippingPhone").value.trim();
        const address = document.getElementById("shippingAddress").value.trim();
        const selectedPaymentRadio = document.querySelector("input[name='paymentMethod']:checked");
        const paymentMethod = selectedPaymentRadio ? selectedPaymentRadio.value : "Card / Online";

        if (!name || !phone || !address) {
            API.showToast("Please provide shipping name, phone and delivery address.", "warning");
            return;
        }

        const submitBtn = document.getElementById("placeOrderBtn");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Creating Order...`;
        }

        try {
            const orderRes = await API.post("/orders/place", {
                user_id: user.user_id,
                shipping_name: name,
                shipping_phone: phone,
                shipping_address: address,
                payment_method: paymentMethod,
                discount_amount: this.discountAmount
            });

            if (!orderRes.success) throw new Error(orderRes.message);

            this.createdOrderId = orderRes.orderId;

            // Open simulated payment modal
            this.openPaymentGatewayModal(paymentMethod);
        } catch (e) {
            API.showToast(e.message || "Failed to place order.", "error");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="bi bi-lock-fill me-2"></i>Proceed to Secure Payment ($${this.finalAmount.toFixed(2)})`;
            }
        }
    },

    openPaymentGatewayModal(method) {
        const modalEl = document.getElementById("paymentModal");
        const modalAmount = document.getElementById("payModalAmount");
        const modalOrderId = document.getElementById("payModalOrderId");

        if (modalAmount) modalAmount.textContent = `$${this.finalAmount.toFixed(2)}`;
        if (modalOrderId) modalOrderId.textContent = `#SB-ORD-${this.createdOrderId}`;

        // Switch payment method tabs in modal
        const cardTab = document.getElementById("payCardTab");
        const upiTab = document.getElementById("payUpiTab");
        const codTab = document.getElementById("payCodTab");

        if (cardTab && upiTab && codTab) {
            if (method.includes("UPI")) {
                new bootstrap.Tab(document.getElementById("pills-upi-tab")).show();
            } else if (method.includes("Cash")) {
                new bootstrap.Tab(document.getElementById("pills-cod-tab")).show();
            }
        }

        const bsModal = new bootstrap.Modal(modalEl, { backdrop: "static" });
        bsModal.show();
    },

    async processSimulatedPayment() {
        const user = Auth.getUser();
        const payBtn = document.getElementById("confirmPaymentBtn");
        if (payBtn) {
            payBtn.disabled = true;
            payBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Authorizing Transaction...`;
        }

        const selectedPaymentRadio = document.querySelector("input[name='paymentMethod']:checked");
        const paymentMethod = selectedPaymentRadio ? selectedPaymentRadio.value : "Card / Online";

        try {
            const payRes = await API.post("/payments/process", {
                order_id: this.createdOrderId,
                user_id: user.user_id,
                payment_method: paymentMethod
            });

            if (payRes.success) {
                // Clear coupon
                localStorage.removeItem("smartbin_active_coupon");
                Auth.updateCartBadge();

                // Show success screen
                document.getElementById("paymentModalContent").innerHTML = `
                    <div class="text-center py-4">
                        <div class="mb-3 text-success">
                            <i class="bi bi-check-circle-fill display-2"></i>
                        </div>
                        <h3 class="fw-bold text-dark mb-2">Payment Confirmed!</h3>
                        <p class="text-muted">Transaction ID: <code>${payRes.transactionId}</code></p>
                        <div class="alert alert-success text-start mx-auto p-3 mb-4" style="max-width: 400px;">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Order Number:</span>
                                <strong>#SB-ORD-${this.createdOrderId}</strong>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span>Total Paid:</span>
                                <strong>$${this.finalAmount.toFixed(2)}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Status:</span>
                                <span class="badge bg-success">Confirmed & Preparing</span>
                            </div>
                        </div>
                        <p class="small text-muted mb-4"><i class="bi bi-gift-fill text-warning me-1"></i> You are automatically entered into this weekend's <strong>Lucky Draw</strong>!</p>
                        <div class="d-flex gap-2 justify-content-center">
                            <a href="/order-tracking.html?order_id=${this.createdOrderId}" class="btn btn-primary-custom px-4 rounded-pill">
                                <i class="bi bi-truck me-1"></i> Track Order Live
                            </a>
                            <a href="/orders.html" class="btn btn-outline-secondary px-4 rounded-pill">
                                View Invoices
                            </a>
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            API.showToast(e.message || "Payment processing failed.", "error");
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.innerHTML = `Confirm & Pay $${this.finalAmount.toFixed(2)}`;
            }
        }
    }
};

window.CheckoutPage = CheckoutPage;
document.addEventListener("DOMContentLoaded", () => {
    CheckoutPage.init();
});
