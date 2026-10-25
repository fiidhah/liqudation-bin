/**
 * SmartBin Admin Management Portal Controller
 */
const AdminPortal = {
    managers: [],
    offers: [],
    draws: [],
    winners: [],
    salesChart: null,

    async init() {
        if (!Auth.requireAuth(["Admin"])) return;
        
        await this.loadDashboardStats();
        await this.loadManagers();
        await this.loadSalesReport();
        await this.loadOffers();
        await this.loadLuckyDraws();
        await this.loadWinners();

        this.setupEventListeners();
    },

    async loadDashboardStats() {
        try {
            const res = await API.get("/admin/dashboard");
            if (res.success && res.dashboard) {
                const d = res.dashboard;
                if (document.getElementById("kpiTotalUsers")) document.getElementById("kpiTotalUsers").textContent = d.totalUsers || 0;
                if (document.getElementById("kpiTotalManagers")) document.getElementById("kpiTotalManagers").textContent = d.totalManagers || 0;
                if (document.getElementById("kpiTotalProducts")) document.getElementById("kpiTotalProducts").textContent = d.totalProducts || 0;
                if (document.getElementById("kpiTotalRevenue")) document.getElementById("kpiTotalRevenue").textContent = `₹${Number(d.totalRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
                if (document.getElementById("kpiTotalOrders")) document.getElementById("kpiTotalOrders").textContent = d.totalOrders || 0;
                if (document.getElementById("kpiActiveOffers")) document.getElementById("kpiActiveOffers").textContent = d.activeOffers || 0;
            }
        } catch (e) {
            console.error("Dashboard stats error:", e);
        }
    },

    // ==========================================
    // MANAGERS CRUD
    // ==========================================
    async loadManagers() {
        const tbody = document.getElementById("managersTableBody");
        if (!tbody) return;

        try {
            const res = await API.get("/managers");
            if (res.success) {
                this.managers = res.data || [];
                this.renderManagers();
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Failed to load managers: ${e.message}</td></tr>`;
        }
    },

    renderManagers() {
        const tbody = document.getElementById("managersTableBody");
        if (!tbody) return;

        if (this.managers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center py-4">No managers registered yet. Click "Add Manager" to onboard staff.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.managers.map(m => `
            <tr>
                <td class="fw-bold">#MGR-${m.manager_id}</td>
                <td>
                    <div class="fw-bold text-dark">${m.full_name}</div>
                    <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${m.address || 'Main Branch'}</small>
                </td>
                <td>${m.email}</td>
                <td>${m.phone || 'N/A'}</td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="AdminPortal.openEditManagerModal(${m.manager_id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="AdminPortal.deleteManager(${m.manager_id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
    },

    openAddManagerModal() {
        document.getElementById("managerFormTitle").textContent = "Add Store Manager";
        document.getElementById("managerForm").reset();
        document.getElementById("managerEditId").value = "";
        document.getElementById("managerPasswordContainer").style.display = "block";
        document.getElementById("managerPassword").setAttribute("required", "required");
        new bootstrap.Modal(document.getElementById("managerModal")).show();
    },

    openEditManagerModal(id) {
        const m = this.managers.find(item => item.manager_id === id);
        if (!m) return;

        document.getElementById("managerFormTitle").textContent = "Edit Manager Details";
        document.getElementById("managerEditId").value = m.manager_id;
        document.getElementById("managerFullName").value = m.full_name;
        document.getElementById("managerEmail").value = m.email;
        document.getElementById("managerPhone").value = m.phone || "";
        document.getElementById("managerAddress").value = m.address || "";
        document.getElementById("managerPasswordContainer").style.display = "none";
        document.getElementById("managerPassword").removeAttribute("required");

        new bootstrap.Modal(document.getElementById("managerModal")).show();
    },

    async saveManager() {
        const id = document.getElementById("managerEditId").value;
        const name = document.getElementById("managerFullName").value.trim();
        const email = document.getElementById("managerEmail").value.trim();
        const passwordInput = document.getElementById("managerPassword");
        const password = passwordInput ? passwordInput.value : "";
        const phoneInput = document.getElementById("managerPhone");
        const phone = phoneInput ? phoneInput.value.trim() : "";
        const addressInput = document.getElementById("managerAddress");
        const address = addressInput ? addressInput.value.trim() : "";
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const PHONE_REGEX = /^[6-9]\d{9}$/;

        if (!name || name.length < 2) {
            API.showToast("Please enter a valid manager full name (minimum 2 characters).", "warning");
            document.getElementById("managerFullName").focus();
            return;
        }

        if (!email || !EMAIL_REGEX.test(email)) {
            API.showToast("Please enter a valid email address.", "warning");
            document.getElementById("managerEmail").focus();
            return;
        }

        if (!id && (!password || password.length < 6)) {
            API.showToast("Password must be at least 6 characters.", "warning");
            if (passwordInput) passwordInput.focus();
            return;
        }

        const cleanPhone = phone ? phone.replace(/\D/g, '') : "";
        if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
            API.showToast("Please enter a valid 10-digit mobile number.", "warning");
            if (phoneInput) phoneInput.focus();
            return;
        }

        try {
            if (id) {
                await API.put(`/admin/managers/update/${id}`, {
                    full_name: name,
                    email,
                    phone: cleanPhone || phone,
                    address
                });
                API.showToast("Manager updated in database!", "success");
            } else {
                if (!password) {
                    API.showToast("Password is required for new manager.", "warning");
                    return;
                }
                await API.post("/managers/register", {
                    full_name: name,
                    email,
                    password,
                    phone: cleanPhone || phone,
                    address
                });
                API.showToast("Manager added to database successfully!", "success");
            }

            bootstrap.Modal.getInstance(document.getElementById("managerModal")).hide();
            await this.loadManagers();
            await this.loadDashboardStats();
        } catch (e) {
            API.showToast(e.message || "Failed to save manager.", "error");
        }
    },

    async deleteManager(id) {
        if (!confirm("Are you sure you want to remove this manager?")) return;

        try {
            await API.delete(`/admin/managers/delete/${id}`);
            API.showToast("Manager deleted from database.", "info");
            await this.loadManagers();
            await this.loadDashboardStats();
        } catch (e) {
            API.showToast(e.message || "Failed to delete manager.", "error");
        }
    },

    // ==========================================
    // SALES REPORT & ANALYTICS
    // ==========================================
    salesReportData: null,
    allSalesOrders: [],
    salesFilter: "All",
    analyticsTrendChart: null,
    fulfillmentChart: null,

    async loadSalesReport() {
        try {
            const res = await API.get("/admin/sales-report");
            if (res.success && res.salesReport) {
                const report = res.salesReport;
                this.salesReportData = report;
                this.allSalesOrders = report.allOrders || [];

                const s = report.summary || {};
                const delivered = Number(s.deliveredOrders || 0);
                const pending = Number(s.pendingOrders || 0) + Number(s.confirmedOrders || 0);
                const shipped = Number(s.shippedOrders || 0);
                const cancelled = Number(s.cancelledOrders || 0);

                if (document.getElementById("reportDeliveredOrders")) document.getElementById("reportDeliveredOrders").textContent = delivered;
                if (document.getElementById("reportPendingOrders")) document.getElementById("reportPendingOrders").textContent = pending;
                if (document.getElementById("reportShippedOrders")) document.getElementById("reportShippedOrders").textContent = shipped;
                if (document.getElementById("reportCancelledOrders")) document.getElementById("reportCancelledOrders").textContent = cancelled;

                // Render Overview Dashboard Chart
                this.renderSalesChart(report.dailyTrends);

                // Render Analytics Tab Charts & Tables
                this.renderAnalyticsCharts(report.dailyTrends, s);
                this.renderCategoryPerformance(report.categoryPerformance);
                this.renderSalesOrdersTable();
            }
        } catch (e) {
            console.error("Sales report error:", e);
        }
    },

    renderSalesChart(dailyTrends) {
        const ctx = document.getElementById("salesTrendChart");
        if (!ctx) return;

        const labels = (dailyTrends && dailyTrends.length) ? dailyTrends.map(t => t.day || t.date) : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const data = (dailyTrends && dailyTrends.length) ? dailyTrends.map(t => Number(t.revenue)) : [0, 0, 0, 0, 0, 0, 0];

        if (this.salesChart) {
            this.salesChart.destroy();
        }

        this.salesChart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Daily Revenue (₹)",
                    data,
                    borderColor: "#ef4444",
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: "#ef4444",
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` Revenue: ₹${Number(ctx.raw).toLocaleString('en-IN')}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: "#f1f5f9" },
                        ticks: {
                            callback: (val) => `₹${val}`
                        }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    },

    renderAnalyticsCharts(dailyTrends, summary) {
        // 1. Daily Revenue & Volume Trend Chart
        const trendCtx = document.getElementById("analyticsTrendChart");
        if (trendCtx) {
            const labels = (dailyTrends && dailyTrends.length) ? dailyTrends.map(t => `${t.day} (${t.date ? t.date.slice(5) : ''})`) : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const revenues = (dailyTrends && dailyTrends.length) ? dailyTrends.map(t => Number(t.revenue)) : [0, 0, 0, 0, 0, 0, 0];
            const orders = (dailyTrends && dailyTrends.length) ? dailyTrends.map(t => Number(t.orders)) : [0, 0, 0, 0, 0, 0, 0];

            if (this.analyticsTrendChart) {
                this.analyticsTrendChart.destroy();
            }

            this.analyticsTrendChart = new Chart(trendCtx, {
                type: "bar",
                data: {
                    labels,
                    datasets: [
                        {
                            type: "line",
                            label: "Revenue (₹)",
                            data: revenues,
                            borderColor: "#3b82f6",
                            backgroundColor: "rgba(59, 130, 246, 0.12)",
                            borderWidth: 3,
                            fill: true,
                            tension: 0.3,
                            yAxisID: "y"
                        },
                        {
                            type: "bar",
                            label: "Order Volume",
                            data: orders,
                            backgroundColor: "rgba(239, 68, 68, 0.75)",
                            borderRadius: 6,
                            yAxisID: "y1"
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    plugins: {
                        legend: { position: "top" }
                    },
                    scales: {
                        y: {
                            type: "linear",
                            display: true,
                            position: "left",
                            beginAtZero: true,
                            grid: { color: "#f1f5f9" },
                            ticks: { callback: (v) => `₹${v}` }
                        },
                        y1: {
                            type: "linear",
                            display: true,
                            position: "right",
                            beginAtZero: true,
                            grid: { drawOnChartArea: false },
                            ticks: { precision: 0, callback: (v) => `${v} orders` }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // 2. Fulfillment Status Distribution Doughnut Chart
        const fulfillCtx = document.getElementById("fulfillmentStatusChart");
        if (fulfillCtx) {
            const delivered = Number(summary.deliveredOrders || 0);
            const shipped = Number(summary.shippedOrders || 0);
            const pending = Number(summary.pendingOrders || 0) + Number(summary.confirmedOrders || 0);
            const cancelled = Number(summary.cancelledOrders || 0);
            const total = delivered + shipped + pending + cancelled || 1;

            if (this.fulfillmentChart) {
                this.fulfillmentChart.destroy();
            }

            this.fulfillmentChart = new Chart(fulfillCtx, {
                type: "doughnut",
                data: {
                    labels: ["Delivered", "In-Transit", "Pending/Processing", "Cancelled"],
                    datasets: [{
                        data: [delivered, shipped, pending, cancelled],
                        backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
                        borderWidth: 2,
                        borderColor: "#ffffff"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom", labels: { boxWidth: 12, padding: 10 } }
                    },
                    cutout: "68%"
                }
            });

            const pillsEl = document.getElementById("fulfillmentSummaryPills");
            if (pillsEl) {
                pillsEl.innerHTML = `
                    <div class="col-3"><strong class="text-success">${delivered}</strong><br><span class="text-muted" style="font-size:11px">Fulfilled</span></div>
                    <div class="col-3"><strong class="text-primary">${shipped}</strong><br><span class="text-muted" style="font-size:11px">In-Transit</span></div>
                    <div class="col-3"><strong class="text-warning">${pending}</strong><br><span class="text-muted" style="font-size:11px">Pending</span></div>
                    <div class="col-3"><strong class="text-danger">${cancelled}</strong><br><span class="text-muted" style="font-size:11px">Cancelled</span></div>
                `;
            }
        }
    },

    renderCategoryPerformance(categories) {
        const container = document.getElementById("categoryPerformanceList");
        if (!container) return;

        if (!categories || categories.length === 0) {
            container.innerHTML = `<div class="text-muted text-center py-3">No category transaction history yet.</div>`;
            return;
        }

        const maxRev = Math.max(...categories.map(c => Number(c.revenue) || 0), 1);

        container.innerHTML = categories.map(c => {
            const rev = Number(c.revenue || 0);
            const pct = Math.round((rev / maxRev) * 100);
            return `
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-1 small">
                        <span class="fw-bold text-dark">${c.category || 'General'}</span>
                        <span class="text-muted">${c.items_sold || 0} sold • <strong class="text-dark">₹${rev.toLocaleString("en-IN")}</strong></span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-success" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        }).join("");
    },

    renderSalesOrdersTable() {
        const tbody = document.getElementById("salesOrdersTableBody");
        if (!tbody) return;

        let filtered = this.allSalesOrders;
        if (this.salesFilter !== "All") {
            if (this.salesFilter === "Pending") {
                filtered = filtered.filter(o => o.order_status === "Pending" || o.order_status === "Confirmed");
            } else {
                filtered = filtered.filter(o => (o.order_status || "").toLowerCase() === this.salesFilter.toLowerCase());
            }
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center py-4">No orders matching status "${this.salesFilter}".</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(o => {
            let statusBadge = "bg-secondary";
            const st = (o.order_status || "Pending").toLowerCase();
            if (st === "delivered") statusBadge = "bg-success";
            else if (st === "shipped") statusBadge = "bg-primary";
            else if (st === "confirmed") statusBadge = "bg-info text-dark";
            else if (st === "pending") statusBadge = "bg-warning text-dark";
            else if (st === "cancelled") statusBadge = "bg-danger";

            const orderDateStr = o.order_date ? new Date(o.order_date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A";

            return `
                <tr>
                    <td class="fw-bold text-dark font-monospace">#ORD-${o.order_id}</td>
                    <td>
                        <div class="fw-bold text-dark">${o.full_name || 'Customer #' + o.user_id}</div>
                        <small class="text-muted">${o.email || 'N/A'}</small>
                    </td>
                    <td class="small text-muted">${orderDateStr}</td>
                    <td class="fw-bold text-dark">₹${Number(o.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td>
                        <span class="badge ${statusBadge} px-2.5 py-1 rounded-pill">${o.order_status || 'Pending'}</span>
                    </td>
                </tr>
            `;
        }).join("");
    },

    filterSalesOrders(status, btn) {
        this.salesFilter = status;
        const group = document.getElementById("salesOrderFilterGroup");
        if (group) {
            group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        }
        if (btn) btn.classList.add("active");
        this.renderSalesOrdersTable();
    },

    // ==========================================
    // PROMOTIONAL OFFERS CRUD
    // ==========================================
    async loadOffers() {
        const tbody = document.getElementById("offersTableBody");
        if (!tbody) return;

        try {
            const res = await API.get("/offers");
            if (res.success) {
                this.offers = res.data || [];
                this.renderOffers();
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">Failed to load offers: ${e.message}</td></tr>`;
        }
    },

    renderOffers() {
        const tbody = document.getElementById("offersTableBody");
        if (!tbody) return;

        if (this.offers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-muted text-center py-4">No promotional offers created yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.offers.map(o => `
            <tr>
                <td><strong class="font-monospace text-dark">#OFF-${o.offer_id}</strong></td>
                <td>
                    <div class="fw-bold">${o.title}</div>
                    <small class="text-muted">${o.description || ''}</small>
                </td>
                <td class="text-success fw-bold">${Number(o.discount_percentage)}% OFF</td>
                <td>${new Date(o.start_date).toLocaleDateString()} - ${new Date(o.end_date).toLocaleDateString()}</td>
                <td>
                    <span class="badge ${o.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${o.status || 'Active'}</span>
                </td>
                <td>
                    <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="AdminPortal.deleteOffer(${o.offer_id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    },

    openAddOfferModal() {
        document.getElementById("offerForm").reset();
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("offerStartDate").value = today;
        new bootstrap.Modal(document.getElementById("offerModal")).show();
    },

    async saveOffer() {
        const title = document.getElementById("offerTitle").value.trim();
        const desc = document.getElementById("offerDesc").value.trim();
        const discount = document.getElementById("offerDiscount").value;
        const startDate = document.getElementById("offerStartDate").value;
        const endDate = document.getElementById("offerEndDate").value;
        const status = document.getElementById("offerStatus").value;

        if (!title || title.length < 2) {
            API.showToast("Please enter an offer title (minimum 2 characters).", "warning");
            document.getElementById("offerTitle").focus();
            return;
        }

        const discNum = Number(discount);
        if (isNaN(discNum) || discNum <= 0 || discNum > 100) {
            API.showToast("Discount percentage must be between 1% and 100%.", "warning");
            document.getElementById("offerDiscount").focus();
            return;
        }

        if (!startDate || !endDate) {
            API.showToast("Please select both start and expiry dates.", "warning");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            API.showToast("Offer start date cannot be after the expiry date.", "warning");
            return;
        }

        try {
            await API.post("/offers/add", {
                title,
                description: desc,
                discount_percentage: discNum,
                start_date: startDate,
                end_date: endDate,
                status
            });

            API.showToast("Promotional offer saved to database!", "success");
            bootstrap.Modal.getInstance(document.getElementById("offerModal")).hide();
            await this.loadOffers();
            await this.loadDashboardStats();
        } catch (e) {
            API.showToast(e.message || "Failed to create offer.", "error");
        }
    },

    async deleteOffer(id) {
        if (!confirm("Are you sure you want to delete this promotional offer?")) return;

        try {
            await API.delete(`/offers/delete/${id}`);
            API.showToast("Offer deleted.", "info");
            await this.loadOffers();
            await this.loadDashboardStats();
        } catch (e) {
            API.showToast(e.message || "Failed to delete offer.", "error");
        }
    },

    // ==========================================
    // LUCKY DRAW CRUD & WINNER PICKER
    // ==========================================
    async loadLuckyDraws() {
        const tbody = document.getElementById("drawsTableBody");
        if (!tbody) return;

        try {
            const res = await API.get("/lucky-draws");
            if (res.success) {
                this.draws = res.data || [];
                this.renderDraws();
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Failed to load draws: ${e.message}</td></tr>`;
        }
    },

    renderDraws() {
        const tbody = document.getElementById("drawsTableBody");
        if (!tbody) return;

        if (this.draws.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center py-4">No Lucky Draws configured. Click "Schedule Draw" to add one.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.draws.map(d => {
            const hasWinner = !!d.winner_id;
            return `
                <tr>
                    <td class="fw-bold">#LD-${d.draw_id}</td>
                    <td>
                        <div class="fw-bold text-dark">${d.draw_name}</div>
                        <small class="text-muted">${d.description || ''}</small>
                    </td>
                    <td>${new Date(d.draw_date).toLocaleDateString()}</td>
                    <td>
                        <span class="badge ${hasWinner ? 'bg-success' : 'bg-primary'}">${hasWinner ? 'Winner Announced: ' + d.winner_name : 'Scheduled'}</span>
                    </td>
                    <td>
                        <div class="d-flex gap-2">
                            ${!hasWinner ? `
                                <button class="btn btn-warning btn-sm rounded-pill fw-bold text-dark" onclick="AdminPortal.pickDrawWinner(${d.draw_id})">
                                    <i class="bi bi-shuffle me-1"></i> Pick Winner
                                </button>
                            ` : `
                                <span class="badge bg-light text-muted border">Completed</span>
                            `}
                            <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="AdminPortal.deleteDraw(${d.draw_id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    },

    openAddDrawModal() {
        document.getElementById("drawForm").reset();
        new bootstrap.Modal(document.getElementById("drawModal")).show();
    },

    async saveDraw() {
        const name = document.getElementById("drawName").value.trim();
        const date = document.getElementById("drawDate").value;
        const desc = document.getElementById("drawDesc").value.trim();

        if (!name || name.length < 2) {
            API.showToast("Please enter a valid draw event name (minimum 2 characters).", "warning");
            document.getElementById("drawName").focus();
            return;
        }

        if (!date) {
            API.showToast("Please select a draw schedule date.", "warning");
            document.getElementById("drawDate").focus();
            return;
        }

        try {
            await API.post("/lucky-draws/add", {
                draw_name: name,
                draw_date: date,
                description: desc
            });

            API.showToast("Weekend Lucky Draw saved in database!", "success");
            bootstrap.Modal.getInstance(document.getElementById("drawModal")).hide();
            await this.loadLuckyDraws();
            await this.loadDashboardStats();
        } catch (e) {
            API.showToast(e.message || "Failed to create draw.", "error");
        }
    },

    async pickDrawWinner(drawId) {
        if (!confirm("Are you ready to randomly select a lucky draw winner from all registered customer accounts?")) return;

        try {
            const res = await API.post(`/lucky-draws/pick-winner/${drawId}`);
            if (res.success && res.winner) {
                const w = res.winner;

                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        title: "🎉 WINNER SELECTED!",
                        html: `
                            <div class="p-3 text-center">
                                <div class="display-3 text-warning mb-2">🏆</div>
                                <h3 class="fw-black text-danger">${w.user.full_name}</h3>
                                <p class="text-muted">${w.user.email} • ${w.user.phone || ''}</p>
                                <div class="alert alert-warning fw-bold fs-6 mb-0">
                                    Event: ${w.draw_name}
                                </div>
                            </div>
                        `,
                        icon: "success",
                        confirmButtonText: "Awesome! Saved to Winners Table",
                        confirmButtonColor: "#dc3545"
                    });
                } else {
                    API.showToast(res.message, "success");
                }

                await this.loadLuckyDraws();
                await this.loadWinners();
            }
        } catch (e) {
            API.showToast(e.message || "Failed to pick winner.", "error");
        }
    },

    async deleteDraw(id) {
        if (!confirm("Are you sure you want to delete this lucky draw?")) return;

        try {
            await API.delete(`/lucky-draws/delete/${id}`);
            API.showToast("Lucky draw deleted from database.", "info");
            await this.loadLuckyDraws();
            await this.loadDashboardStats();
        } catch (e) {
            API.showToast(e.message || "Failed to delete draw.", "error");
        }
    },

    // ==========================================
    // WINNERS AUDIT LOG
    // ==========================================
    async loadWinners() {
        const tbody = document.getElementById("adminWinnersTableBody");
        if (!tbody) return;

        try {
            const res = await API.get("/lucky-draws/winners/all");
            if (res.success) {
                this.winners = res.data || [];
                this.renderWinners();
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Failed to load winners: ${e.message}</td></tr>`;
        }
    },

    renderWinners() {
        const tbody = document.getElementById("adminWinnersTableBody");
        if (!tbody) return;

        if (this.winners.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center py-4">No lucky draw winners announced yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.winners.map(w => `
            <tr>
                <td class="fw-bold">#WIN-${w.winner_id}</td>
                <td>
                    <div class="fw-bold text-dark">${w.full_name}</div>
                    <small class="text-muted">${w.email} • ${w.phone || 'N/A'}</small>
                </td>
                <td><strong class="text-danger">${w.draw_name}</strong></td>
                <td>${w.draw_description || 'Lucky Draw Customer Prize'}</td>
                <td>${new Date(w.announced_at).toLocaleString()}</td>
            </tr>
        `).join("");
    },

    setupEventListeners() {
        document.querySelectorAll("[data-admin-tab]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                document.querySelectorAll("[data-admin-tab]").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                const target = btn.dataset.adminTab;
                document.querySelectorAll(".admin-tab-content").forEach(sec => sec.style.display = "none");
                const targetSec = document.getElementById(`tab-${target}`);
                if (targetSec) {
                    targetSec.style.display = "block";
                    // Dynamically refresh and resize charts when switching tabs
                    if (target === "sales") {
                        AdminPortal.loadSalesReport();
                    } else if (target === "dashboard") {
                        AdminPortal.loadDashboardStats();
                        AdminPortal.loadSalesReport();
                    }
                }
            });
        });
    }
};

window.AdminPortal = AdminPortal;
document.addEventListener("DOMContentLoaded", () => {
    AdminPortal.init();
});
