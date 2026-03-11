import axios from 'axios';
import { toast } from 'react-toastify';

// Create a custom axios instance
const api = axios.create({
    // Using Vite proxy instead of explicit baseURL to bypass browser same-site strictness
    // Important: Required to send/receive cookies (like our refresh token)
    withCredentials: true
});

// We need a variable to hold the interceptor so we can eject it if needed,
// but for this simple app, we can just define it directly.

// Request Interceptor: Attach the access token to every outgoing request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and automatic token refresh
api.interceptors.response.use(
    (response) => {
        return response; // If the request succeeds, simply return it
    },
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 (Unauthorized) and we haven't already retried this request
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Mark this request as retried so we don't get into an infinite loop
            originalRequest._retry = true;

            try {
                const res = await api.post('/api/refresh');
                const newAccessToken = res.data.accessToken;
                const newAccessTokenExp = res.data.accessTokenExp;

                localStorage.setItem('accessToken', newAccessToken);
                if (newAccessTokenExp) {
                    localStorage.setItem('accessTokenExp', newAccessTokenExp);
                }

                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                toast.info("🔌 API Interceptor fired: Token refreshed silently before request.", {
                    autoClose: 3000,
                });

                return api(originalRequest);

            } catch (refreshError) {
                console.error("Session expired. Please log in again.");
                localStorage.removeItem('accessToken');
                localStorage.removeItem('accessTokenExp');
                localStorage.removeItem('refreshTokenExp');
                localStorage.removeItem('user');
                return Promise.reject(refreshError);
            }
        }

        // If it's a different error (e.g., 500, 404), just reject the promise normally
        return Promise.reject(error);
    }
);

export default api;
