import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('twinware_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('twinware_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await API.get('/auth/me');
          setUser(response.data);
          localStorage.setItem('twinware_user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Failed to restore authenticated user:', error);
          localStorage.removeItem('twinware_token');
          localStorage.removeItem('twinware_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      const { token: newToken, ...userData } = response.data;

      localStorage.setItem('twinware_token', newToken);
      localStorage.setItem('twinware_user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await API.post('/auth/register', { username, email, password });
      const { token: newToken, ...userData } = response.data;

      localStorage.setItem('twinware_token', newToken);
      localStorage.setItem('twinware_user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('twinware_token');
    localStorage.removeItem('twinware_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
