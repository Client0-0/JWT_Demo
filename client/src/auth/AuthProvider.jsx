/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../axios/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Initialize state from localStorage so the user stays logged in after a page refresh
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // The access token is stored in localStorage by the interceptor/login function
    // but we can also track auth state boolean here
    const isAuthenticated = !!user;

    const login = async (email, password) => {
        try {
            const response = await api.post('/login', { email, password });

            const { user: userData, accessToken } = response.data;

            // Store the access token for the Axios interceptor to use
            localStorage.setItem('accessToken', accessToken);

            // Store the user info for the UI
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            // Tell the server to clear the refresh token cookie
            await api.post('/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            // Clear local state regardless of server response
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const updateUser = (newUserData) => {
        const updatedUser = { ...user, ...newUserData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};
