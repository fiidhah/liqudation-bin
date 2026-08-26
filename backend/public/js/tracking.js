/**
 * SmartBin Visual Order Tracker Controller
 */
const TrackingPage = {
    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get("order_id");

        if (orderId) {
            const input = document.getElementById("trackingInput");
            if (input) input.value = orderId;
            await this.trackOrder(orderId);
        }

        const form = document.getElementById("trackingSearchForm");
        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const id = document.getElementById("trackingInput").value.trim().replace("#SB-", "").replace("SB-", "").replace("ORD-", "");
                if (id) {
                    await this.trackOrder(id);
                } else {
                    API.showToast("Please enter an Order ID.", "warning");
                }
            });
        }
    },

    async trackOrder(orderId) {
        const container = document.getElementById("trackingResultContainer");
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">Retrieving shipment progress for Order #${orderId}...</p>
            </div>
        `;

        try {
            const res = await API.get(`/orders/${orderId}`);
            if (!res.success || !res.data) {
                container.innerHTML = `
                    <div class="alert alert-warning text-center p-4">
                        <i class="bi bi-exclamation-triangle fs-3 d-block mb-2"></i>
                        <h5>Order Not Found</h5>
                        <p class="mb-0">Please verify your order number and try again.</p>
                    </div>
                `;
                return;
            }

            const o = res.data;
            this.renderTracking(o);
        } catch (e) {
            container.innerHTML = `
                <div class="alert alert-danger text-center p-4">
                    <h5>Unable to find tracking details</h5>
                    <p class="mb-0">${e.message}</p>
                </div>
            `;
        }
    },

    renderTracking(order) {
        const container = document.getElementById("trackingResultContainer");
        if (!container) return;

        const statuses = ["Pending", "Confirmed", "Shipped", "Delivered"];
        const isCancelled = order.order_status === "Cancelled";
        const currentIdx = statuses.indexOf(order.order_status);

        const orderDate = new Date(order.order_date).toLocaleString();

        container.innerHTML = `
            <div class="card border-0 shadow rounded-4 overflow-hidden mb-4">
                <div class="card-header bg-dark text-white p-4 d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <span class="badge bg-warning text-dark text-uppercase px-3 py-2 rounded-pill fw-bold mb-1">
                            Live Tracking
                        </span>
                        <h4 class="fw-bold mb-0">Order #SB-ORD-${order.order_id}</h4>
                    </div>
                    <div class="text-end">
                        <div class="small text-white-50">Order Placed On</div>
                        <div class="fw-bold">${orderDate}</div>
                    </div>
                </div>

                <div class="card-body p-4 p-md-5">
                    ${isCancelled ? `
                        <div class="alert alert-danger text-center p-4 rounded-4">
                            <i class="bi bi-x-circle-fill display-3 text-danger mb-2"></i>
                            <h4 class="fw-bold">This Order Has Been Cancelled</h4>
                            <p class="text-muted mb-0">If payment was captured, an automated refund will be credited to your original payment method.</p>
                        </div>
                    ` : `
                        <div class="timeline-container px-md-4 py-3">
                            <div class="track-step ${currentIdx >= 0 ? 'completed' : ''} ${currentIdx === 0 ? 'current' : ''}">
                                <div class="track-icon"><i class="bi bi-receipt"></i></div>
                                <div>
                                    <h6 class="fw-bold mb-0">Order Placed</h6>
                                    <small class="text-muted">Order received in SmartBin system</small>
                                </div>
                            </div>

                            <div class="track-step ${currentIdx >= 1 ? 'completed' : ''} ${currentIdx === 1 ? 'current' : ''}">
                                <div class="track-icon"><i class="bi bi-box-seam"></i></div>
                                <div>
                                    <h6 class="fw-bold mb-0">Payment Verified & Bin Picking</h6>
                                    <small class="text-muted">Item picked from liquidation bin & quality inspected</small>
                                </div>
                            </div>

                            <div class="track-step ${currentIdx >= 2 ? 'completed' : ''} ${currentIdx === 2 ? 'current' : ''}">
                                <div class="track-icon"><i class="bi bi-truck"></i></div>
                                <div>
                                    <h6 class="fw-bold mb-0">Dispatched & Out for Delivery</h6>
                                    <small class="text-muted">Courier is en route to your address</small>
                                </div>
                            </div>

                            <div class="track-step ${currentIdx >= 3 ? 'completed' : ''} ${currentIdx === 3 ? 'current' : ''}">
                                <div class="track-icon"><i class="bi bi-house-door-fill"></i></div>
                                <div>
                                    <h6 class="fw-bold mb-0">Delivered Successfully</h6>
                                    <small class="text-muted">Package handed over to customer</small>
                                </div>
                            </div>
                        </div>
                    `}

                    <div class="row g-4 mt-3 pt-4 border-top">
                        <div class="col-md-6">
                            <h6 class="fw-bold text-uppercase small text-muted">Shipping Destination</h6>
                            <p class="mb-0">
                                <strong>${order.shipping_name || order.customer_name}</strong><br>
                                ${order.shipping_address}<br>
                                Phone: ${order.shipping_phone || order.customer_phone}
                            </p>
                        </div>
                        <div class="col-md-6">
                            <h6 class="fw-bold text-uppercase small text-muted">Items in Shipment (${order.items.length})</h6>
                            <ul class="list-unstyled mb-0">
                                ${order.items.map(item => `
                                    <li class="d-flex justify-content-between align-items-center py-1 small">
                                        <span><i class="bi bi-check2 text-success me-1"></i> ${item.product_name} (Qty: ${item.quantity})</span>
                                        <span class="fw-bold">$${(item.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                `).join("")}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

window.TrackingPage = TrackingPage;
document.addEventListener("DOMContentLoaded", () => {
    TrackingPage.init();
});
