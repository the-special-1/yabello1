import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

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

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (token) => {
    try {
      localStorage.setItem('token', token);
      const response = await axios.get('/api/users/my-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const userData = await response.data;
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
