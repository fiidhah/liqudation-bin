/**
 * SmartBin Weekend Lucky Draw & Winners Controller
 */
const LuckyDrawPage = {
    draws: [],
    winners: [],

    async init() {
        await Promise.all([
            this.loadDraws(),
            this.loadWinners()
        ]);
        this.checkCustomerEligibility();
    },

    async loadDraws() {
        const container = document.getElementById("activeDrawsContainer");
        if (!container) return;

        try {
            const res = await API.get("/lucky-draws");
            if (res.success) {
                this.draws = res.data || [];
                this.renderDraws();
            }
        } catch (e) {
            container.innerHTML = `<div class="alert alert-secondary">Failed to load draws: ${e.message}</div>`;
        }
    },

    renderDraws() {
        const container = document.getElementById("activeDrawsContainer");
        if (!container) return;

        if (this.draws.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="card p-4 text-center border-0 shadow-sm rounded-3 bg-white">
                        <i class="bi bi-gift fs-1 text-muted mb-2"></i>
                        <h5 class="fw-bold">No Active Lucky Draws Right Now</h5>
                        <p class="text-muted small">Stay tuned! Weekend draws are scheduled on Friday restocks.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.draws.map(draw => {
            const drawDate = new Date(draw.draw_date).toLocaleDateString("en-US", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            return `
                <div class="col-md-6 mb-3">
                    <div class="card border p-4 rounded-3 h-100 bg-white shadow-sm d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="badge bg-dark text-white px-2 py-1 small">#LD-${draw.draw_id}</span>
                                <small class="text-muted"><i class="bi bi-calendar-event me-1"></i>${drawDate}</small>
                            </div>
                            <h5 class="fw-bold mb-2 text-dark">${draw.draw_name}</h5>
                            <p class="text-secondary small mb-3">${draw.description || 'Place any order to automatically qualify for this drawing.'}</p>
                        </div>
                        <div class="pt-3 border-top d-flex justify-content-between align-items-center">
                            <span class="badge ${draw.winner_id ? 'bg-success' : 'bg-primary'} px-3 py-2">
                                ${draw.winner_id ? 'Winner Announced: ' + draw.winner_name : 'Scheduled'}
                            </span>
                            <a href="/products.html" class="btn btn-outline-dark btn-sm">
                                Shop to Enter
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    },

    async loadWinners() {
        const container = document.getElementById("winnersListContainer");
        if (!container) return;

        try {
            const res = await API.get("/lucky-draws/winners/all");
            if (res.success) {
                this.winners = res.data || [];
                this.renderWinners();
            }
        } catch (e) {
            container.innerHTML = `<div class="alert alert-secondary">Failed to load winners: ${e.message}</div>`;
        }
    },

    renderWinners() {
        const container = document.getElementById("winnersListContainer");
        if (!container) return;

        if (this.winners.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="card p-4 text-center border-0 shadow-sm rounded-3 bg-white">
                        <i class="bi bi-award fs-1 text-muted mb-2"></i>
                        <h6 class="fw-bold mb-1">No Past Winners Yet</h6>
                        <p class="text-muted small mb-0">Winners will be announced once the scheduled draws are conducted.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.winners.map(w => {
            const announcedDate = new Date(w.announced_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
            return `
                <div class="col-md-4 mb-3">
                    <div class="card border p-3 rounded-3 bg-white shadow-sm h-100">
                        <div class="d-flex align-items-center gap-3">
                            <div class="kpi-icon bg-light text-dark">
                                <i class="bi bi-trophy"></i>
                            </div>
                            <div>
                                <h6 class="fw-bold mb-0 text-dark">${w.full_name}</h6>
                                <small class="text-muted d-block">${w.draw_name}</small>
                                <span class="badge bg-light text-secondary border mt-1">${announcedDate}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    },

    checkCustomerEligibility() {
        const elContainer = document.getElementById("eligibilityNotice");
        if (!elContainer) return;

        if (!Auth.isLoggedIn()) {
            elContainer.innerHTML = `
                <div class="alert alert-light border d-flex justify-content-between align-items-center p-3 rounded-3">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-info-circle text-primary fs-5"></i>
                        <div>
                            <strong>Want to check your entry eligibility?</strong>
                            <div class="small text-muted">Sign in to your customer account to view your automatic tickets.</div>
                        </div>
                    </div>
                    <a href="/login.html" class="btn btn-dark btn-sm">Sign In</a>
                </div>
            `;
        } else {
            const user = Auth.getUser();
            elContainer.innerHTML = `
                <div class="alert alert-light border border-success p-3 rounded-3 d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-check-circle-fill text-success fs-5"></i>
                        <div>
                            <strong class="text-success">Account Active: ${user.full_name}</strong>
                            <div class="small text-muted">All purchases placed under this account qualify for active lucky draws.</div>
                        </div>
                    </div>
                    <a href="/products.html" class="btn btn-outline-dark btn-sm">Shop Now</a>
                </div>
            `;
        }
    }
};

window.LuckyDrawPage = LuckyDrawPage;
document.addEventListener("DOMContentLoaded", () => {
    LuckyDrawPage.init();
});
