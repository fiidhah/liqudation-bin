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

    // Toast alert helper
    showToast(message, type = "success") {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: type,
                title: message,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        } else {
            alert(message);
        }
    }
};

window.API = API;
