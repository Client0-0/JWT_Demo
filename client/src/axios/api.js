import axios from 'axios';

// Create a custom axios instance
const api = axios.create({
    baseURL: 'http://127.0.0.1:3000',
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
                // Attempt to get a new access token using the refresh token (sent automatically via cookie)
                const res = await api.post('/refresh');

                const newAccessToken = res.data.accessToken;

                // Save the new token
                localStorage.setItem('accessToken', newAccessToken);

                // Update the Authorization header for the original (failed) request
                // and for future requests made by this axios instance
                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                // Retry the original request with the new token
                return api(originalRequest);

            } catch (refreshError) {
                // If the refresh token also fails (e.g., it expired), the user needs to log in again
                // In a real app, you might want to trigger a global logout event here
                console.error("Session expired. Please log in again.");
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                // You could emit an event here to notify the AuthProvider to update state
                // For simplicity, we'll let the next component re-render handle it
                return Promise.reject(refreshError);
            }
        }

        // If it's a different error (e.g., 500, 404), just reject the promise normally
        return Promise.reject(error);
    }
);

export default api;
