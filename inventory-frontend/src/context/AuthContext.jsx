import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

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
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login({ username, password });
      const { token: newToken, refreshToken, userId, username: userName, email, orgId, tenantId, branchId, industryType, roles } = response.data;
      
      // Construct user object with all relevant fields including tenantId
      const userData = {
        id: userId,
        username: userName,
        email,
        orgId,
        tenantId,
        branchId,
        industryType,
        roles
      };
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('tenantId', tenantId);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { token: newToken, refreshToken, userId, username: userName, email, orgId, tenantId, branchId, industryType, roles } = response.data;
      
      // Construct user object with all relevant fields including tenantId
      const newUser = {
        id: userId,
        username: userName,
        email,
        orgId,
        tenantId,
        branchId,
        industryType,
        roles
      };
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('tenantId', tenantId);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    
    // Optional: Call backend logout endpoint
    try {
      authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
