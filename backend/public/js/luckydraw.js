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
            container.innerHTML = `<div class="alert alert-danger">Failed to load draws: ${e.message}</div>`;
        }
    },

    renderDraws() {
        const container = document.getElementById("activeDrawsContainer");
        if (!container) return;

        const upcoming = this.draws.filter(d => d.status === "Upcoming");

        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="card p-4 text-center border-0 shadow-sm rounded-4">
                        <i class="bi bi-gift fs-1 text-muted mb-2"></i>
                        <h5 class="fw-bold">No Active Lucky Draws Right Now</h5>
                        <p class="text-muted">Stay tuned! Our weekend mega draws are scheduled every Friday-Sunday.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = upcoming.map(draw => {
            const drawDate = new Date(draw.draw_date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
            return `
                <div class="col-md-6 mb-4">
                    <div class="lucky-draw-card h-100 d-flex flex-column justify-content-between">
                        <div>
                            <span class="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold mb-3">
                                <i class="bi bi-trophy-fill me-1"></i> UPCOMING WEEKEND DRAW
                            </span>
                            <h3 class="fw-bold mb-2">${draw.draw_name}</h3>
                            <div class="d-flex align-items-center gap-2 mb-3">
                                <span class="fs-4 text-warning fw-black"><i class="bi bi-gift-fill me-2"></i>Grand Prize:</span>
                                <span class="fs-5 fw-bold">${draw.prize}</span>
                            </div>
                            <p class="text-white-50">${draw.description || 'Place any order from our liquidation bins before the draw date to automatically receive free entry tickets!'}</p>
                        </div>
                        <div class="mt-4 pt-3 border-top border-white-50 d-flex justify-content-between align-items-center">
                            <div>
                                <small class="text-white-50 d-block">Announcement Date</small>
                                <strong><i class="bi bi-calendar-event me-1"></i> ${drawDate}</strong>
                            </div>
                            <a href="/products.html" class="btn btn-warning btn-sm rounded-pill px-3 fw-bold text-dark">
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
            container.innerHTML = `<div class="alert alert-danger">Failed to load winners: ${e.message}</div>`;
        }
    },

    renderWinners() {
        const container = document.getElementById("winnersListContainer");
        if (!container) return;

        if (this.winners.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-4 text-muted">
                    <p>No winners announced yet. Check back after this weekend's draw!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.winners.map(w => {
            const date = new Date(w.announced_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            // Mask email for privacy (e.g. fi***@gmail.com)
            const emailParts = w.email.split("@");
            const maskedEmail = emailParts[0].substring(0, 2) + "***@" + (emailParts[1] || "");

            return `
                <div class="col-md-4 mb-3">
                    <div class="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
                        <div class="d-flex align-items-center gap-3">
                            <div class="kpi-icon bg-warning-subtle text-warning">
                                <i class="bi bi-award-fill"></i>
                            </div>
                            <div>
                                <h6 class="fw-bold mb-0 text-dark">${w.full_name}</h6>
                                <small class="text-muted">${maskedEmail}</small>
                            </div>
                        </div>
                        <div class="mt-3 pt-2 border-top">
                            <div class="small text-muted">Prize Won:</div>
                            <div class="fw-bold text-danger"><i class="bi bi-gift me-1"></i>${w.prize_won}</div>
                            <div class="small text-muted mt-1"><i class="bi bi-clock me-1"></i>${w.draw_name} • ${date}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    },

    async checkCustomerEligibility() {
        const elContainer = document.getElementById("eligibilityNotice");
        if (!elContainer) return;

        if (!Auth.isLoggedIn()) {
            elContainer.innerHTML = `
                <div class="alert alert-light border shadow-sm p-4 rounded-4 text-center">
                    <h5 class="fw-bold mb-2"><i class="bi bi-ticket-perforated-fill text-warning me-2"></i>Want to check your Lucky Draw entries?</h5>
                    <p class="text-muted mb-3">Log in to view your automatically earned lucky draw tickets from your bin orders!</p>
                    <a href="/login.html" class="btn btn-outline-dark btn-sm rounded-pill px-4">Log in to Check Status</a>
                </div>
            `;
            return;
        }

        const user = Auth.getUser();
        try {
            const res = await API.get(`/orders/user/${user.user_id}`);
            const orderCount = res.data ? res.data.length : 0;

            if (orderCount > 0) {
                elContainer.innerHTML = `
                    <div class="alert alert-success border-0 shadow-sm p-4 rounded-4 d-flex align-items-center gap-3">
                        <div class="display-5 text-success"><i class="bi bi-ticket-perforated-fill"></i></div>
                        <div>
                            <h5 class="fw-bold mb-1">🎉 You Are Eligible For The Weekend Lucky Draw!</h5>
                            <p class="mb-0 text-dark">You have <strong>${orderCount} valid entry ticket(s)</strong> registered with your recent SmartBin orders. Good luck!</p>
                        </div>
                    </div>
                `;
            } else {
                elContainer.innerHTML = `
                    <div class="alert alert-info border-0 shadow-sm p-4 rounded-4 d-flex align-items-center gap-3">
                        <div class="display-5 text-primary"><i class="bi bi-cart-check"></i></div>
                        <div>
                            <h5 class="fw-bold mb-1">Enter This Weekend's Lucky Draw!</h5>
                            <p class="mb-0">Place your first order from any of our liquidation bins today to automatically unlock your free Lucky Draw entry.</p>
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            // silent fallback
        }
    }
};

window.LuckyDrawPage = LuckyDrawPage;
document.addEventListener("DOMContentLoaded", () => {
    LuckyDrawPage.init();
});
