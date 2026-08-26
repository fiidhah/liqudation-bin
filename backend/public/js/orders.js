/**
 * SmartBin Customer Orders & Printable Invoice Controller
 */
const OrdersPage = {
    orders: [],

    async init() {
        if (!Auth.requireAuth(["User", "Manager", "Admin"])) return;
        await this.loadOrders();
    },

    async loadOrders() {
        const user = Auth.getUser();
        const container = document.getElementById("ordersListContainer");
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">Loading your purchase history...</p>
            </div>
        `;

        try {
            const res = await API.get(`/orders/user/${user.user_id}`);
            if (res.success) {
                this.orders = res.data || [];
                this.renderOrders();
            }
        } catch (e) {
            container.innerHTML = `
                <div class="alert alert-danger">Failed to load orders: ${e.message}</div>
            `;
        }
    },

    renderOrders() {
        const container = document.getElementById("ordersListContainer");
        if (!container) return;

        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm rounded-4 p-5 text-center">
                    <i class="bi bi-box-seam display-3 text-muted mb-3"></i>
                    <h4 class="fw-bold">No Past Purchases Yet</h4>
                    <p class="text-muted">Start shopping from today's liquidation bins to get unbeatable prices and lucky draw tickets!</p>
                    <a href="/products.html" class="btn btn-primary-custom rounded-pill px-4 py-2 mx-auto mt-2">
                        <i class="bi bi-bag-plus me-1"></i> Explore Products
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.orders.map(order => {
            const orderDate = new Date(order.order_date).toLocaleString();
            let statusBadge = "bg-secondary";
            if (order.order_status === "Confirmed") statusBadge = "bg-primary";
            else if (order.order_status === "Shipped") statusBadge = "bg-warning text-dark";
            else if (order.order_status === "Delivered") statusBadge = "bg-success";
            else if (order.order_status === "Cancelled") statusBadge = "bg-danger";

            return `
                <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                    <div class="card-header bg-light p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div class="d-flex align-items-center gap-3">
                            <span class="fs-5 fw-bold text-dark">Order #SB-${order.order_id}</span>
                            <span class="badge ${statusBadge} px-3 py-2 rounded-pill">${order.order_status}</span>
                        </div>
                        <div class="text-muted small">
                            <i class="bi bi-calendar3 me-1"></i> ${orderDate}
                        </div>
                    </div>
                    <div class="card-body p-3 p-md-4">
                        <div class="row g-3">
                            <div class="col-lg-8">
                                <h6 class="text-uppercase small text-muted fw-bold mb-3">Purchased Items (${order.items.length})</h6>
                                <div class="d-flex flex-column gap-3">
                                    ${order.items.map(item => `
                                        <div class="d-flex align-items-center justify-content-between pb-2 border-bottom">
                                            <div class="d-flex align-items-center gap-3">
                                                <img src="${item.image}" class="rounded-3" style="width: 50px; height: 50px; object-fit: cover;">
                                                <div>
                                                    <h6 class="mb-0 fw-bold">${item.product_name}</h6>
                                                    <small class="text-muted">Bin: ${item.bin_number || 'Bin A'} • ${item.condition_type} • Qty: ${item.quantity}</small>
                                                </div>
                                            </div>
                                            <div class="fw-bold text-dark">$${(item.price * item.quantity).toFixed(2)}</div>
                                        </div>
                                    `).join("")}
                                </div>
                            </div>
                            <div class="col-lg-4 border-start-lg ps-lg-4">
                                <div class="bg-light p-3 rounded-3 mb-3">
                                    <h6 class="fw-bold mb-2">Delivery & Summary</h6>
                                    <div class="small text-muted mb-2">
                                        <strong>Ship to:</strong> ${order.shipping_name}<br>
                                        ${order.shipping_address}<br>
                                        Phone: ${order.shipping_phone}
                                    </div>
                                    <div class="d-flex justify-content-between small text-muted">
                                        <span>Subtotal:</span>
                                        <span>$${Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                    ${order.discount_amount > 0 ? `
                                        <div class="d-flex justify-content-between small text-success">
                                            <span>Coupon Discount:</span>
                                            <span>-$${Number(order.discount_amount).toFixed(2)}</span>
                                        </div>
                                    ` : ''}
                                    <div class="d-flex justify-content-between fw-bold fs-6 text-dark mt-1 pt-1 border-top">
                                        <span>Total Paid:</span>
                                        <span class="text-danger">$${Number(order.final_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div class="d-grid gap-2">
                                    <a href="/order-tracking.html?order_id=${order.order_id}" class="btn btn-outline-primary btn-sm rounded-pill">
                                        <i class="bi bi-geo-alt me-1"></i> Track Shipment
                                    </a>
                                    <button class="btn btn-outline-dark btn-sm rounded-pill" onclick="OrdersPage.openInvoiceModal(${order.order_id})">
                                        <i class="bi bi-printer me-1"></i> View / Print Invoice
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    },

    async openInvoiceModal(orderId) {
        try {
            const res = await API.get(`/orders/${orderId}`);
            if (!res.success || !res.data) return;

            const o = res.data;
            const modalEl = document.getElementById("invoiceModal");
            const modalBody = document.getElementById("invoiceModalBody");
            if (!modalEl || !modalBody) return;

            const orderDate = new Date(o.order_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

            modalBody.innerHTML = `
                <div id="invoicePrintSection" class="p-4 bg-white">
                    <div class="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
                        <div>
                            <div class="d-flex align-items-center gap-2">
                                <i class="bi bi-box2-heart-fill fs-2 text-danger"></i>
                                <h3 class="fw-black text-dark mb-0">SMARTBIN STORE</h3>
                            </div>
                            <p class="text-muted small mb-0">Smart Liquidation Bins & Overstock Deals</p>
                            <p class="text-muted small">support@smartbin.com | 1-800-SMARTBIN</p>
                        </div>
                        <div class="text-end">
                            <h4 class="text-uppercase fw-bold text-secondary mb-1">INVOICE</h4>
                            <div class="fw-bold">#SB-INV-${o.order_id}</div>
                            <div class="small text-muted">Date: ${orderDate}</div>
                            <span class="badge bg-success mt-1">Payment Verified</span>
                        </div>
                    </div>

                    <div class="row mb-4">
                        <div class="col-6">
                            <h6 class="text-uppercase small text-muted fw-bold">BILLED & SHIPPED TO:</h6>
                            <div class="fw-bold text-dark">${o.shipping_name || o.customer_name}</div>
                            <div class="small text-muted">${o.shipping_address || 'Customer Delivery Address'}</div>
                            <div class="small text-muted">Phone: ${o.shipping_phone || o.customer_phone}</div>
                            <div class="small text-muted">Email: ${o.customer_email}</div>
                        </div>
                        <div class="col-6 text-end">
                            <h6 class="text-uppercase small text-muted fw-bold">ORDER DETAILS:</h6>
                            <div class="small"><strong>Order ID:</strong> #SB-ORD-${o.order_id}</div>
                            <div class="small"><strong>Status:</strong> ${o.order_status}</div>
                            <div class="small"><strong>Payment Method:</strong> ${o.payment_method}</div>
                        </div>
                    </div>

                    <table class="table table-bordered align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>#</th>
                                <th>Item Description</th>
                                <th>Bin / Condition</th>
                                <th class="text-center">Qty</th>
                                <th class="text-end">Price</th>
                                <th class="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${o.items.map((item, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>
                                        <strong>${item.product_name}</strong><br>
                                        <small class="text-muted">${item.brand || 'Generic'} • ${item.category}</small>
                                    </td>
                                    <td>${item.bin_number} • ${item.condition_type}</td>
                                    <td class="text-center">${item.quantity}</td>
                                    <td class="text-end">$${Number(item.price).toFixed(2)}</td>
                                    <td class="text-end fw-bold">$${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="5" class="text-end">Subtotal:</td>
                                <td class="text-end fw-bold">$${Number(o.total_amount).toFixed(2)}</td>
                            </tr>
                            ${o.discount_amount > 0 ? `
                                <tr>
                                    <td colspan="5" class="text-end text-success">Promotional Discount:</td>
                                    <td class="text-end text-success fw-bold">-$${Number(o.discount_amount).toFixed(2)}</td>
                                </tr>
                            ` : ''}
                            <tr class="table-light fs-5">
                                <td colspan="5" class="text-end fw-bold">Final Total Paid:</td>
                                <td class="text-end fw-black text-danger">$${Number(o.final_amount).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div class="mt-4 pt-3 border-top text-center text-muted small">
                        <p class="mb-1">Thank you for shopping at SmartBin Liquidation Store!</p>
                        <p class="mb-0">All items are covered under our liquidation condition verification guarantee.</p>
                    </div>
                </div>
            `;

            const bsModal = new bootstrap.Modal(modalEl);
            bsModal.show();
        } catch (e) {
            API.showToast("Could not load invoice details", "error");
        }
    },

    printInvoice() {
        window.print();
    }
};

window.OrdersPage = OrdersPage;
document.addEventListener("DOMContentLoaded", () => {
    OrdersPage.init();
});
