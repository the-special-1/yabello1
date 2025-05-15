import React, { createContext, useContext, useState } from 'react';
import apiService from '../utils/apiService';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (userData, token) => {
    try {
      localStorage.setItem('token', token);
      setUser(userData);
    } catch (error) {
      console.error('Error in login:', error);
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
