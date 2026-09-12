import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Token invalid or expired", error);
          localStorage.removeItem('token');
          localStorage.removeItem('role');
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    // OAuth2PasswordRequestForm expects form data
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData);
    const { access_token, role } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('role', role);
    
    // Fetch user details
    const userResponse = await api.get('/auth/me');
    setUser(userResponse.data);
    
    return role;
  };

  const register = async (name, email, password) => {
    await api.post('/auth/register', { name, email, password });
    return login(email, password); // Log in immediately after registering
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
