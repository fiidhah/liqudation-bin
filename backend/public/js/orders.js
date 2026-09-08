/**
 * SmartBin Customer Orders & Printable Invoice Controller (Indian Rupees ₹)
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
                <div class="spinner-border text-dark" role="status"></div>
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
                <div class="alert alert-secondary">Failed to load orders: ${e.message}</div>
            `;
        }
    },

    renderOrders() {
        const container = document.getElementById("ordersListContainer");
        if (!container) return;

        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm rounded-3 p-5 text-center bg-white">
                    <i class="bi bi-box-seam fs-1 text-muted mb-3"></i>
                    <h5 class="fw-bold">No Past Purchases Yet</h5>
                    <p class="text-muted small">Start shopping from today's liquidation bins to get unbeatable prices and lucky draw tickets!</p>
                    <a href="/products.html" class="btn btn-primary-custom rounded-2 px-4 py-2 mx-auto mt-2">
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
                <div class="card border rounded-3 mb-4 overflow-hidden bg-white shadow-sm">
                    <div class="card-header bg-light p-3 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom">
                        <div class="d-flex align-items-center gap-3">
                            <span class="fs-6 fw-bold text-dark">Order #SB-ORD-${order.order_id}</span>
                            <span class="badge ${statusBadge} px-3 py-1 rounded-2">${order.order_status}</span>
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
                                                <img src="${item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}" class="rounded-2 border" style="width: 50px; height: 50px; object-fit: contain; background: #F8FAFC; padding: 2px;" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'">
                                                <div>
                                                    <h6 class="mb-0 fw-bold text-dark">${item.product_name}</h6>
                                                    <small class="text-muted">${item.category || 'General'} • Qty: ${item.quantity}</small>
                                                </div>
                                            </div>
                                            <div class="fw-bold text-dark">₹${(Number(item.price) * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                                        </div>
                                    `).join("")}
                                </div>
                            </div>
                            <div class="col-lg-4 border-start-lg ps-lg-4">
                                <div class="bg-light p-3 rounded-2 mb-3">
                                    <h6 class="fw-bold mb-2">Delivery & Summary</h6>
                                    <div class="small text-muted mb-2">
                                        <strong>Ship to:</strong> ${order.shipping_name || 'Customer'}<br>
                                        ${order.shipping_address || 'Registered Address'}<br>
                                        Phone: ${order.shipping_phone || 'N/A'}
                                    </div>
                                    <hr class="my-2">
                                    <div class="d-flex justify-content-between fw-bold text-dark fs-6">
                                        <span>Total Paid:</span>
                                        <span class="text-danger">₹${Number(order.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div class="d-grid gap-2">
                                    <a href="/order-tracking.html?order_id=${order.order_id}" class="btn btn-outline-dark btn-sm rounded-2">
                                        <i class="bi bi-truck me-1"></i> Live Tracker
                                    </a>
                                    <button class="btn btn-outline-secondary btn-sm rounded-2" onclick="OrdersPage.openInvoice(${order.order_id})">
                                        <i class="bi bi-file-earmark-text me-1"></i> View Receipt
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    },

    async openInvoice(orderId) {
        try {
            const res = await API.get(`/orders/${orderId}`);
            if (!res.success || !res.data) return;

            const o = res.data;
            const modalBody = document.getElementById("invoiceModalBody");
            if (!modalBody) return;

            const orderDate = new Date(o.order_date).toLocaleString();

            modalBody.innerHTML = `
                <div class="p-3" id="printableReceipt">
                    <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                        <div>
                            <h4 class="fw-bold text-dark mb-0">SmartBin Liquidation</h4>
                            <small class="text-muted">Certified Overstock & Liquidation Haul</small>
                        </div>
                        <div class="text-end">
                            <h6 class="fw-bold mb-0">TAX INVOICE</h6>
                            <small class="text-muted">#SB-ORD-${o.order_id}</small>
                        </div>
                    </div>

                    <div class="row mb-4 small">
                        <div class="col-6">
                            <strong>Billed / Shipped To:</strong><br>
                            ${o.shipping_name || 'Customer'}<br>
                            ${o.shipping_address || 'Address on file'}<br>
                            Phone: ${o.shipping_phone || 'N/A'}<br>
                            Email: ${o.customer_email || 'N/A'}
                        </div>
                        <div class="col-6 text-end">
                            <strong>Order Date:</strong> ${orderDate}<br>
                            <strong>Payment Method:</strong> ${o.payment_method || 'Online Payment'}<br>
                            <strong>Status:</strong> ${o.order_status}
                        </div>
                    </div>

                    <table class="table table-bordered table-sm align-middle small mb-4">
                        <thead class="table-light">
                            <tr>
                                <th>#</th>
                                <th>Item Description</th>
                                <th class="text-center">Qty</th>
                                <th class="text-end">Unit Price</th>
                                <th class="text-end">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${o.items.map((it, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td><strong>${it.product_name}</strong></td>
                                    <td class="text-center">${it.quantity}</td>
                                    <td class="text-end">₹${Number(it.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                    <td class="text-end">₹${(Number(it.price) * it.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="4" class="text-end">Grand Total:</th>
                                <th class="text-end text-danger fs-6">₹${Number(o.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</th>
                            </tr>
                        </tfoot>
                    </table>

                    <div class="text-center small text-muted border-top pt-3">
                        Thank you for shopping at SmartBin Liquidation Store. All items inspected and certified.
                    </div>
                </div>
            `;

            new bootstrap.Modal(document.getElementById("invoiceModal")).show();
        } catch (e) {
            API.showToast("Could not load invoice: " + e.message, "error");
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
