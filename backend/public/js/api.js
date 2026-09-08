/**
 * SmartBin API Client Utility
 */
const API = {
    BASE_URL: window.location.origin + "/api",

    getToken() {
        return localStorage.getItem("smartbin_token");
    },

    getHeaders(isFormData = false) {
        const headers = {};
        if (!isFormData) {
            headers["Content-Type"] = "application/json";
        }
        const token = this.getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    },

    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const isFormData = options.body instanceof FormData;

        const config = {
            ...options,
            headers: {
                ...this.getHeaders(isFormData),
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, error);
            throw error;
        }
    },

    get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        return this.request(url, { method: "GET" });
    },

    post(endpoint, body) {
        const isFormData = body instanceof FormData;
        return this.request(endpoint, {
            method: "POST",
            body: isFormData ? body : JSON.stringify(body)
        });
    },

    put(endpoint, body) {
        const isFormData = body instanceof FormData;
        return this.request(endpoint, {
            method: "PUT",
            body: isFormData ? body : JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: "DELETE" });
    },

    // ==========================================================
    // STANDARD MODAL & NOTIFICATION METHODS (Std Method Suite)
    // ==========================================================

    // 1. Standard Top Notification Toast
    showToast(message, type = "success") {
        if (typeof Swal !== "undefined") {
            return Swal.fire({
                toast: true,
                position: "top-end",
                icon: type,
                title: message,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                customClass: {
                    popup: "smartbin-swal-toast"
                }
            });
        } else {
            alert(message);
        }
    },

    // 2. Standard Modal Dialog (Std Method)
    showModal({
        title = "Notification",
        text = "",
        html = "",
        icon = "info",
        confirmButtonText = "OK",
        confirmButtonColor = "#0F172A",
        showCancelButton = false,
        cancelButtonText = "Cancel",
        timer = null,
        timerProgressBar = false,
        allowOutsideClick = true
    } = {}) {
        if (typeof Swal !== "undefined") {
            const config = {
                title,
                icon,
                confirmButtonText,
                confirmButtonColor,
                showCancelButton,
                cancelButtonText,
                reverseButtons: true,
                allowOutsideClick,
                customClass: {
                    popup: "smartbin-swal-popup",
                    title: "smartbin-swal-title",
                    confirmButton: "smartbin-swal-confirm",
                    cancelButton: "smartbin-swal-cancel"
                }
            };
            if (html) config.html = html;
            else if (text) config.text = text;
            if (timer) {
                config.timer = timer;
                config.timerProgressBar = timerProgressBar;
            }
            return Swal.fire(config);
        } else {
            alert(text || title);
            return Promise.resolve({ isConfirmed: true });
        }
    },

    // 3. Standard Login Success Modal (Specialized Std Method)
    showLoginSuccess({ user, role = "User", onContinue } = {}) {
        const name = user && (user.full_name || user.email) ? (user.full_name || user.email.split("@")[0]) : "User";
        const roleLabel = role || "Customer";
        
        let destination = "Storefront Catalog";
        let roleBadgeColor = "#FEF3C7; color: #92400E";
        if (roleLabel === "Admin") {
            destination = "Admin Dashboard";
            roleBadgeColor = "#FEE2E2; color: #991B1B";
        } else if (roleLabel === "Manager") {
            destination = "Manager Portal";
            roleBadgeColor = "#DBEAFE; color: #1E40AF";
        }

        if (typeof Swal !== "undefined") {
            return Swal.fire({
                icon: "success",
                title: "Login Successful!",
                html: `
                    <div class="py-2 text-center">
                        <h5 class="fw-bold text-dark mb-1">Welcome back, ${name}!</h5>
                        <div class="mb-3">
                            <span class="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill fw-bold" style="background: ${roleBadgeColor}; font-size: 0.85rem;">
                                <i class="bi bi-shield-check"></i> ${roleLabel} Account
                            </span>
                        </div>
                        <div class="p-2 rounded-3 bg-light border small text-secondary d-flex align-items-center justify-content-center gap-2">
                            <span class="spinner-border spinner-border-sm text-warning" role="status"></span>
                            <span>Redirecting to <b>${destination}</b>...</span>
                        </div>
                    </div>
                `,
                confirmButtonText: "Continue Now",
                confirmButtonColor: "#0F172A",
                timer: 1600,
                timerProgressBar: true,
                allowOutsideClick: false,
                customClass: {
                    popup: "smartbin-swal-popup",
                    title: "smartbin-swal-title",
                    confirmButton: "smartbin-swal-confirm"
                }
            }).then((result) => {
                if (typeof onContinue === "function") {
                    onContinue();
                }
                return result;
            });
        } else {
            alert(`Welcome back, ${name}! Redirecting to ${destination}...`);
            if (typeof onContinue === "function") {
                onContinue();
            }
            return Promise.resolve({ isConfirmed: true });
        }
    },

    // 4. Standard Success Modal
    showSuccessModal(title, text, confirmButtonText = "Continue") {
        return this.showModal({
            title,
            text,
            icon: "success",
            confirmButtonText
        });
    },

    // 5. Standard Error Modal
    showErrorModal(title = "Action Failed", text = "An error occurred. Please try again.") {
        return this.showModal({
            title,
            text,
            icon: "error",
            confirmButtonText: "OK"
        });
    },

    // 6. Standard Confirm Modal
    async showConfirmModal(title, text, confirmButtonText = "Yes, Proceed", cancelButtonText = "Cancel") {
        const res = await this.showModal({
            title,
            text,
            icon: "question",
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText
        });
        return res.isConfirmed;
    }
};

window.API = API;
