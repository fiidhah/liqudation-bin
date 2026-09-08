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

        const status = (order.order_status || "Pending").trim();
        const isCancelled = status === "Cancelled";
        const isDelivered = status === "Delivered";
        const isShipped = status === "Shipped";
        const isConfirmed = status === "Confirmed";
        const isPending = status === "Pending";

        const orderDate = new Date(order.order_date).toLocaleString();

        let headerStatusBadge = `bg-warning text-dark`;
        let headerStatusLabel = `🟡 ${status}`;
        if (isDelivered) {
            headerStatusBadge = `bg-success text-white`;
            headerStatusLabel = `🟢 Delivered`;
        } else if (isShipped) {
            headerStatusBadge = `bg-info text-dark`;
            headerStatusLabel = `🚚 Out for Delivery`;
        } else if (isConfirmed) {
            headerStatusBadge = `bg-primary text-white`;
            headerStatusLabel = `🔵 Confirmed & Preparing`;
        } else if (isCancelled) {
            headerStatusBadge = `bg-danger text-white`;
            headerStatusLabel = `🔴 Cancelled`;
        }

        container.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
                <div class="card-header bg-dark p-4 d-flex flex-wrap justify-content-between align-items-center gap-3" style="background: #0F172A !important;">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-warning text-dark text-uppercase px-3 py-1 rounded-pill fw-bold" style="font-size: 11px; letter-spacing: 0.5px;">
                                <i class="bi bi-broadcast me-1"></i> Live Tracker
                            </span>
                            <span class="badge ${headerStatusBadge} px-3 py-1 rounded-pill fw-bold" style="font-size: 11px;">
                                ${headerStatusLabel}
                            </span>
                        </div>
                        <h3 class="fw-bold mb-0 text-white" style="color: #FFFFFF !important; letter-spacing: -0.5px;">
                            Order #SB-ORD-${order.order_id}
                        </h3>
                    </div>
                    <div class="text-md-end text-white">
                        <div class="small text-white-50">Order Date & Time</div>
                        <div class="fw-bold text-white fs-6" style="color: #FFFFFF !important;">
                            <i class="bi bi-calendar-event me-1"></i> ${orderDate}
                        </div>
                    </div>
                </div>

                <div class="card-body p-4 p-md-5">
                    ${isCancelled ? `
                        <div class="alert alert-danger text-center p-4 rounded-4">
                            <i class="bi bi-x-circle-fill display-3 text-danger mb-2"></i>
                            <h4 class="fw-bold">This Order Has Been Cancelled</h4>
                            <p class="text-muted mb-0">If payment was captured, an automated refund will be processed to your original payment method.</p>
                        </div>
                    ` : `
                        <!-- TOP STATUS BANNER (REAL-TIME STATUS) -->
                        ${isDelivered ? `
                            <div class="alert alert-success d-flex align-items-center gap-3 p-3 p-md-4 rounded-3 mb-4 border-0 shadow-sm bg-success bg-opacity-10">
                                <i class="bi bi-check-circle-fill fs-1 text-success flex-shrink-0"></i>
                                <div>
                                    <h5 class="fw-bold mb-1 text-success">Delivered Successfully</h5>
                                    <p class="mb-0 small text-muted">Package has been delivered to customer and verified by manager. Thank you for shopping with SmartBin Liquidation!</p>
                                </div>
                            </div>
                        ` : isShipped ? `
                            <div class="alert alert-info d-flex align-items-center gap-3 p-3 p-md-4 rounded-3 mb-4 border-0 shadow-sm bg-info bg-opacity-10">
                                <i class="bi bi-truck fs-1 text-info flex-shrink-0"></i>
                                <div>
                                    <h5 class="fw-bold mb-1 text-primary">Dispatched & Out for Delivery</h5>
                                    <p class="mb-0 small text-muted">Your package has departed the warehouse and is currently with the courier. <strong>Package has not been delivered yet.</strong></p>
                                </div>
                            </div>
                        ` : isConfirmed ? `
                            <div class="alert alert-primary d-flex align-items-center gap-3 p-3 p-md-4 rounded-3 mb-4 border-0 shadow-sm bg-primary bg-opacity-10">
                                <i class="bi bi-box-seam-fill fs-1 text-primary flex-shrink-0"></i>
                                <div>
                                    <h5 class="fw-bold mb-1 text-primary">Order Confirmed • Picking from Liquidation Bins</h5>
                                    <p class="mb-0 small text-muted">Manager has confirmed your order. Items are currently being picked and quality inspected in the warehouse. <strong>Package has NOT been delivered yet.</strong></p>
                                </div>
                            </div>
                        ` : `
                            <div class="alert alert-warning d-flex align-items-center gap-3 p-3 p-md-4 rounded-3 mb-4 border-0 shadow-sm bg-warning bg-opacity-15">
                                <i class="bi bi-hourglass-split fs-1 text-warning flex-shrink-0"></i>
                                <div>
                                    <h5 class="fw-bold mb-1 text-dark">Order Received • Awaiting Warehouse Verification</h5>
                                    <p class="mb-0 small text-muted">Your order is registered. Warehouse manager will review inventory and confirm dispatch shortly. <strong>Package has NOT been delivered yet.</strong></p>
                                </div>
                            </div>
                        `}

                        <!-- VERTICAL SHIPMENT TIMELINE -->
                        <div class="shipment-timeline px-md-3 py-2">
                            <!-- STEP 1: ORDER PLACED -->
                            <div class="shipment-step completed">
                                <div class="shipment-icon-wrap">
                                    <i class="bi bi-check-lg"></i>
                                </div>
                                <div class="shipment-content">
                                    <div class="shipment-title-row">
                                        <h6 class="shipment-title">Order Placed</h6>
                                        <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Completed</span>
                                    </div>
                                    <p class="shipment-desc">Order registered in SmartBin system with payment/authorization logged.</p>
                                </div>
                            </div>

                            <!-- STEP 2: PAYMENT & BIN PICKING -->
                            <div class="shipment-step ${isPending ? 'current' : 'completed'}">
                                <div class="shipment-icon-wrap">
                                    <i class="bi ${isPending ? 'bi-box-seam' : 'bi-check-lg'}"></i>
                                </div>
                                <div class="shipment-content">
                                    <div class="shipment-title-row">
                                        <h6 class="shipment-title">Payment Verified & Bin Picking</h6>
                                        ${isPending ? `
                                            <span class="badge bg-primary px-2 py-1">Current Status</span>
                                        ` : `
                                            <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Completed</span>
                                        `}
                                    </div>
                                    <p class="shipment-desc">
                                        ${isPending ? 'Awaiting verification and item picking from liquidation bins.' : 'Confirmed by warehouse manager. Items picked from liquidation bins & quality inspected.'}
                                    </p>
                                </div>
                            </div>

                            <!-- STEP 3: DISPATCH & TRANSIT -->
                            <div class="shipment-step ${isDelivered ? 'completed' : isShipped ? 'current' : isConfirmed ? 'current' : 'pending'}">
                                <div class="shipment-icon-wrap">
                                    <i class="bi ${isDelivered ? 'bi-check-lg' : isShipped ? 'bi-truck' : isConfirmed ? 'bi-box-seam' : 'bi-truck'}"></i>
                                </div>
                                <div class="shipment-content">
                                    <div class="shipment-title-row">
                                        <h6 class="shipment-title">${isShipped ? 'Dispatched & Out for Delivery' : isConfirmed ? 'Preparing for Dispatch' : 'Courier Dispatch & Transit'}</h6>
                                        ${isDelivered ? `
                                            <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Completed</span>
                                        ` : isShipped ? `
                                            <span class="badge bg-info text-dark px-2 py-1">In Transit</span>
                                        ` : isConfirmed ? `
                                            <span class="badge bg-primary px-2 py-1">In Warehouse Dock</span>
                                        ` : `
                                            <span class="badge bg-light text-muted border px-2 py-1">Pending</span>
                                        `}
                                    </div>
                                    <p class="shipment-desc">
                                        ${isDelivered ? 'Courier completed transport to destination.' : isShipped ? 'Package is out with courier en route to customer destination.' : isConfirmed ? 'Packed and staged at warehouse dock awaiting courier pickup.' : 'Package will be assigned to courier after bin picking is finalized.'}
                                    </p>
                                </div>
                            </div>

                            <!-- STEP 4: DELIVERY (ONLY COMPLETED IF STATUS IS DELIVERED) -->
                            <div class="shipment-step ${isDelivered ? 'completed' : 'pending pending-delivery'}">
                                <div class="shipment-icon-wrap">
                                    <i class="bi ${isDelivered ? 'bi-check2-circle' : 'bi-clock-history'}"></i>
                                </div>
                                <div class="shipment-content">
                                    <div class="shipment-title-row">
                                        <h6 class="shipment-title ${isDelivered ? 'text-success' : 'text-warning-emphasis'}">
                                            ${isDelivered ? 'Delivered Successfully' : 'Pending Delivery (Not Delivered Yet)'}
                                        </h6>
                                        ${isDelivered ? `
                                            <span class="badge bg-success px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i>Delivered</span>
                                        ` : `
                                            <span class="badge bg-warning text-dark border border-warning px-2 py-1">
                                                <i class="bi bi-clock-history me-1"></i>Not Delivered Yet
                                            </span>
                                        `}
                                    </div>
                                    <p class="shipment-desc ${isDelivered ? '' : 'text-muted'}">
                                        ${isDelivered ? 
                                            'Package was handed over to customer. Delivery confirmed in manager module.' : 
                                            'This package has <strong>NOT</strong> been delivered yet. Manager has not marked it as delivered.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    `}

                    <div class="row g-4 mt-2 pt-4 border-top">
                        <div class="col-md-6">
                            <h6 class="fw-bold text-uppercase small text-muted mb-2">Shipping Destination</h6>
                            <div class="p-3 bg-light rounded-3 border">
                                <strong class="text-dark fs-6">${order.shipping_name || order.customer_name || 'Customer'}</strong><br>
                                <span class="text-muted small">${order.shipping_address || 'Registered Shipping Address'}</span><br>
                                <span class="text-muted small"><i class="bi bi-telephone me-1"></i>${order.shipping_phone || order.customer_phone || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6 class="fw-bold text-uppercase small text-muted mb-2">Items in Shipment (${order.items ? order.items.length : 0})</h6>
                            <div class="p-3 bg-light rounded-3 border">
                                <ul class="list-unstyled mb-0 d-flex flex-column gap-2">
                                    ${(order.items || []).map(item => `
                                        <li class="d-flex justify-content-between align-items-center small pb-2 border-bottom last-border-0">
                                            <div class="d-flex align-items-center gap-2">
                                                ${item.image ? `<img src="${item.image}" class="rounded border" style="width: 36px; height: 36px; object-fit: contain; background: #FFFFFF; padding: 2px;" onerror="this.style.display='none'">` : ''}
                                                <div>
                                                    <span class="fw-bold text-dark d-block">${item.product_name}</span>
                                                    <span class="text-muted" style="font-size: 11px;">Qty: ${item.quantity} ${item.brand ? '• ' + item.brand : ''}</span>
                                                </div>
                                            </div>
                                            <span class="fw-bold text-dark">₹${(Number(item.price) * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                        </li>
                                    `).join("")}
                                </ul>
                                <div class="d-flex justify-content-between align-items-center pt-2 mt-1 border-top fw-bold text-dark">
                                    <span>Total Amount:</span>
                                    <span class="text-danger fs-6">₹${Number(order.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
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
