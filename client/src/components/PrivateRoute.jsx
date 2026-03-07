import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // If the user is not authenticated, redirect them to the login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, render the protected component
    return children;
};

export default PrivateRoute;
