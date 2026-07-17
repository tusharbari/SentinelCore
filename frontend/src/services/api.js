import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080/api",
});

// Automatically attach JWT token to every request
api.interceptors.request.use(

    (config) => {

        const token = sessionStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }

);

// Automatically refresh expired access token and retry original requests
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/auth/login") &&
            !originalRequest.url.includes("/auth/refreshtoken")
        ) {
            originalRequest._retry = true;
            const refreshToken = sessionStorage.getItem("refreshToken");

            if (refreshToken) {
                try {
                    const response = await axios.post(`${api.defaults.baseURL}/auth/refreshtoken`, {
                        refreshToken: refreshToken,
                    });

                    if (response.data.accessToken) {
                        sessionStorage.setItem("token", response.data.accessToken);
                        if (response.data.refreshToken) {
                            sessionStorage.setItem("refreshToken", response.data.refreshToken);
                        }

                        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    console.error("Token refresh failed", refreshError);
                    // Clear all session storage items on token refresh failure
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("refreshToken");
                    sessionStorage.removeItem("email");
                    sessionStorage.removeItem("role");
                    sessionStorage.removeItem("isLoggedIn");
                    window.location.href = "/";
                    return Promise.reject(refreshError);
                }
            } else {
                // Clear and redirect if no refresh token exists
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("email");
                sessionStorage.removeItem("role");
                sessionStorage.removeItem("isLoggedIn");
                window.location.href = "/";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
