import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return window.location.protocol === 'https:' 
      ? 'https://www.yabellobingo.com/api'
      : 'http://www.yabellobingo.com/api';
  }
  return 'http://localhost:5001';
};

axios.defaults.baseURL = getBaseUrl();

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (storedToken && userData) {
      const parsedUser = JSON.parse(userData);
      // Ensure isAgentView is preserved from localStorage
      if (parsedUser.username && parsedUser.username.toLowerCase().startsWith('agent.')) {
        parsedUser.isAgentView = true;
      }
      setToken(storedToken);
      setUser(parsedUser);
      setupAxiosInterceptors(storedToken);
    }
    setLoading(false);
  }, []);

  const setupAxiosInterceptors = (authToken) => {
    axios.interceptors.request.use(
      (config) => {
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
  };

  const login = (userData, newToken) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setupAxiosInterceptors(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
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
