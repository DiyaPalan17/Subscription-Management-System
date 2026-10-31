'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from './api';

export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyName?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  switchDemoRole: (role: Role) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  loginWithCredentials: async () => ({ success: false }),
  switchDemoRole: async () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('brightloop_token');
    const savedUser = localStorage.getItem('brightloop_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('brightloop_token');
        localStorage.removeItem('brightloop_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('brightloop_token', newToken);
    localStorage.setItem('brightloop_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('brightloop_token');
    localStorage.removeItem('brightloop_user');
    window.location.href = '/login';
  };

  const loginWithCredentials = async (email: string, password: string) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data?.token && res.data?.user) {
      login(res.data.token, res.data.user);
      return { success: true };
    }

    return { success: false, message: res.message || 'Login failed' };
  };

  const switchDemoRole = async (targetRole: Role) => {
    let email = 'admin@brightloop.io';
    let password = 'Admin@12345!';

    if (targetRole === 'STAFF') {
      email = 'staff@brightloop.io';
      password = 'Staff@12345!';
    } else if (targetRole === 'CUSTOMER') {
      email = 'customer@acme.com';
      password = 'Customer@12345!';
    }

    const result = await loginWithCredentials(email, password);
    if (result.success) {
      if (targetRole === 'CUSTOMER') {
        window.location.href = '/portal';
      } else {
        window.location.href = '/dashboard';
      }
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        loginWithCredentials,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
