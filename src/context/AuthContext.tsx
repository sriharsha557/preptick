import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiGet } from '../lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  curriculum?: string;
  grade?: number;
  subjects?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userId: string, email: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, userId: string, email: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', email);

    // Set basic user info immediately
    setUser({
      id: userId,
      email,
    });

    // Fetch full profile in background
    refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('supabase_session');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setUser(null);
        return;
      }

      const data = await apiGet<{
        id: string;
        email: string;
        name?: string;
        curriculum?: string;
        grade?: number;
        subjects?: string;
      }>(`/api/users/${userId}/profile`);

      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        curriculum: data.curriculum,
        grade: data.grade,
        subjects: data.subjects ? JSON.parse(data.subjects) : [],
      });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If token is invalid, log out
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
