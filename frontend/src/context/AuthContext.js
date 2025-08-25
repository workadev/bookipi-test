import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api';
import { useRouter } from 'next/router';

// Create the auth context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check for authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Get current user from stored cookie
          const currentUser = authService.getUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/login');
  };

  // Value object for the context provider
  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin ?? false,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for using auth context
export function useAuth() {
  return useContext(AuthContext);
}
