import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const response = await authAPI.getProfile();
                setUser(response.data);
                setIsAuthenticated(true);
            } catch (error) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setIsAuthenticated(false);
            }
        }
        setLoading(false);
    };

    const login = async (credentials) => {
        const response = await authAPI.login(credentials);
        const { user, tokens } = response.data;

        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);

        setUser(user);
        setIsAuthenticated(true);

        return user;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            // Continue with logout even if API fails
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            login,
            logout,
            updateUser,
            checkAuth,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
