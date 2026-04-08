import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token and get user details from backend
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // Use URLSearchParams for OAuth2PasswordRequestForm compatibility if needed, 
      // or JSON if your backend accepts it. 
      // Based on typical FastAPI OAuth2 setup, it might expect form data or JSON depending on implementation.
      // Your auth.py uses UserLogin pydantic model for /login endpoint which expects JSON.
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      
      // Fetch user details immediately after login
      const userResponse = await api.get('/auth/me');
      setUser(userResponse.data);
      return userResponse.data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
        await api.post('/auth/register', userData);
        return true;
    } catch (error) {
        console.error("Register failed:", error);
        throw error;
    }
  }

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (e) {
      console.error("Refresh user failed", e);
    }
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    register,
    refreshUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
