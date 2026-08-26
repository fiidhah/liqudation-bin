/**
 * SmartBin Promotional Offers & Deals Controller
 */
const OffersPage = {
    offers: [],

    async init() {
        await this.loadOffers();
    },

    async loadOffers() {
        const container = document.getElementById("offersListContainer");
        if (!container) return;

        try {
            const res = await API.get("/offers/active");
            if (res.success) {
                this.offers = res.data || [];
                this.renderOffers();
            }
        } catch (e) {
            container.innerHTML = `<div class="alert alert-danger">Failed to load offers: ${e.message}</div>`;
        }
    },

    renderOffers() {
        const container = document.getElementById("offersListContainer");
        if (!container) return;

        if (this.offers.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No active promotional vouchers right now. Check back soon for flash bin discounts!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.offers.map(offer => {
            const validUntil = new Date(offer.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const minSpend = Number(offer.min_order_amount) || 0;

            return `
                <div class="col-md-4 mb-4">
                    <div class="card border-0 shadow-sm rounded-4 h-100 p-4 bg-white position-relative overflow-hidden">
                        <div class="position-absolute top-0 end-0 bg-danger text-white px-3 py-1 rounded-bottom-start small fw-bold">
                            ${Number(offer.discount_percentage)}% OFF
                        </div>
                        <div class="mb-3">
                            <span class="badge bg-warning-subtle text-dark px-3 py-2 rounded-pill fw-bold">
                                <i class="bi bi-tag-fill text-warning me-1"></i> Promo Voucher
                            </span>
                        </div>
                        <h4 class="fw-bold text-dark mb-2">${offer.title}</h4>
                        <p class="text-muted small flex-grow-1">${offer.description || 'Valid on all liquidation bin categories and overstock checkouts.'}</p>
                        
                        <div class="bg-light p-3 rounded-3 my-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <small class="text-muted d-block">PROMO CODE</small>
                                    <strong class="fs-5 text-dark font-monospace">${offer.code}</strong>
                                </div>
                                <button class="btn btn-outline-dark btn-sm rounded-pill px-3" onclick="OffersPage.copyCoupon('${offer.code}')">
                                    <i class="bi bi-clipboard me-1"></i> Copy
                                </button>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
                            <span>Min spend: <strong>$${minSpend.toFixed(2)}</strong></span>
                            <span>Expires: <strong>${validUntil}</strong></span>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    },

    copyCoupon(code) {
        navigator.clipboard.writeText(code).then(() => {
            API.showToast(`Coupon code "${code}" copied to clipboard! Paste it in your cart.`, "success");
        }).catch(() => {
            API.showToast(`Code: ${code}`, "info");
        });
    }
};

window.OffersPage = OffersPage;
document.addEventListener("DOMContentLoaded", () => {
    OffersPage.init();
});
