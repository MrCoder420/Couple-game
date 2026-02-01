import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { AuthService } from '../services/AuthService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  signup: (name: string, email: string) => Promise<void>;
  logout: () => void;
  switchUser: () => Promise<void>; // For testing
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await AuthService.login(email);
      setUser(loggedInUser);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string) => {
    setIsLoading(true);
    try {
      const newUser = await AuthService.signup(name, email);
      setUser(newUser);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };
  
  const switchUser = async () => {
      if (!user) return;
      setIsLoading(true);
      // Toggle between user_1 and user_2
      const nextId = user.id === 'user_1' ? 'user_2' : 'user_1';
      const switchedUser = await AuthService.mockSwitchUser(nextId);
      setUser(switchedUser);
      setIsLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
