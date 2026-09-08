/**
 * SmartBin Authentication & Session Management
 */
const Auth = {
    getUser() {
        const userJson = localStorage.getItem("smartbin_user");
        return userJson ? JSON.parse(userJson) : null;
    },

    getRole() {
        return localStorage.getItem("smartbin_role") || "Guest";
    },

    isLoggedIn() {
        return !!localStorage.getItem("smartbin_token");
    },

    setSession(token, user, role = "User") {
        localStorage.setItem("smartbin_token", token);
        localStorage.setItem("smartbin_user", JSON.stringify(user));
        localStorage.setItem("smartbin_role", role);
    },

    logout() {
        localStorage.removeItem("smartbin_token");
        localStorage.removeItem("smartbin_user");
        localStorage.removeItem("smartbin_role");
        localStorage.removeItem("smartbin_active_coupon");
        window.location.href = "/login.html";
    },

    requireAuth(allowedRoles = []) {
        if (!this.isLoggedIn()) {
            window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
            return false;
        }

        const role = this.getRole();
        if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
            if (typeof API !== "undefined" && typeof API.showErrorModal === "function") {
                API.showErrorModal("Access Denied", `You need ${allowedRoles.join(" or ")} privileges to view this portal.`).then(() => {
                    window.location.href = "/index.html";
                });
            } else {
                alert(`Access Denied. You need ${allowedRoles.join(" or ")} privileges.`);
                window.location.href = "/index.html";
            }
            return false;
        }

        return true;
    },

    renderNavbar() {
        const navAuthContainer = document.getElementById("navAuthSection");
        if (!navAuthContainer) return;

        if (this.isLoggedIn()) {
            const user = this.getUser();
            const role = this.getRole();
            const displayName = user ? (user.full_name || user.email.split("@")[0]) : "Account";

            let portalLink = "";
            if (role === "Admin") {
                portalLink = `<li><a class="dropdown-item fw-bold text-danger" href="/admin/index.html"><i class="bi bi-shield-lock me-2"></i>Admin Dashboard</a></li>`;
            } else if (role === "Manager") {
                portalLink = `<li><a class="dropdown-item fw-bold text-primary" href="/manager/index.html"><i class="bi bi-gear me-2"></i>Manager Portal</a></li>`;
            }

            navAuthContainer.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-dark dropdown-toggle d-flex align-items-center gap-2 rounded-pill px-3 py-1 shadow-sm" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle fs-6 text-warning"></i>
                        <span class="small fw-bold">${displayName}</span>
                        <span class="badge bg-warning text-dark ms-1" style="font-size: 10px;">${role}</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3">
                        ${portalLink}
                        ${role === "User" ? `
                            <li><a class="dropdown-item" href="/orders.html"><i class="bi bi-box-seam me-2"></i>My Orders & Invoices</a></li>
                            <li><a class="dropdown-item" href="/wishlist.html"><i class="bi bi-heart me-2"></i>My Wishlist</a></li>
                        ` : ''}
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                    </ul>
                </div>
            `;
        } else {
            navAuthContainer.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                    <a href="/login.html" class="btn btn-outline-dark btn-sm rounded-pill px-3 fw-bold"><i class="bi bi-box-arrow-in-right me-1"></i>Login</a>
                    <a href="/register.html" class="btn btn-dark btn-sm rounded-pill px-3 fw-bold">Register</a>
                </div>
            `;
        }

        this.updateCartBadge();
    },

    async updateCartBadge() {
        const cartBadge = document.getElementById("cartCountBadge");
        if (!cartBadge) return;

        const user = this.getUser();
        if (!user || !user.user_id) {
            cartBadge.textContent = "0";
            return;
        }

        try {
            const res = await API.get(`/cart/${user.user_id}`);
            if (res.success && res.data) {
                cartBadge.textContent = res.data.length;
            }
        } catch (e) {
            cartBadge.textContent = "0";
        }
    }
};

window.Auth = Auth;
document.addEventListener("DOMContentLoaded", () => {
    Auth.renderNavbar();
});
