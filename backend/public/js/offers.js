/**
 * SmartBin Promotional Offers Controller
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
            container.innerHTML = `<div class="alert alert-secondary">Could not load offers: ${e.message}</div>`;
        }
    },

    renderOffers() {
        const container = document.getElementById("offersListContainer");
        if (!container) return;

        if (this.offers.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="card p-5 text-center border-0 shadow-sm rounded-3 bg-white">
                        <i class="bi bi-tag fs-1 text-muted mb-2"></i>
                        <h5 class="fw-bold">No Active Coupons</h5>
                        <p class="text-muted small">Check back soon for new discount offers!</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.offers.map(offer => {
            const discPercent = Number(offer.discount_percentage || 15);
            return `
                <div class="col-md-6 col-lg-4">
                    <div class="card border rounded-3 p-4 bg-white shadow-sm h-100 d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="badge bg-dark text-white px-2 py-1">Save ${discPercent}%</span>
                                <small class="text-muted"><i class="bi bi-clock me-1"></i>Active Deal</small>
                            </div>
                            <h5 class="fw-bold text-dark mb-2">${offer.title}</h5>
                            <p class="text-secondary small mb-3">${offer.description || 'Apply this promo discount at checkout.'}</p>
                        </div>
                        <div class="pt-3 border-top d-flex justify-content-between align-items-center">
                            <span class="font-monospace fw-bold text-primary">${offer.title.toUpperCase().replace(/\s+/g, '')}</span>
                            <button class="btn btn-outline-dark btn-sm" onclick="OffersPage.copyCode('${offer.title.toUpperCase().replace(/\s+/g, '')}')">
                                <i class="bi bi-copy me-1"></i> Copy
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    },

    copyCode(code) {
        navigator.clipboard.writeText(code);
        API.showToast(`Coupon "${code}" copied to clipboard!`, "success");
    }
};

window.OffersPage = OffersPage;
document.addEventListener("DOMContentLoaded", () => {
    OffersPage.init();
});
