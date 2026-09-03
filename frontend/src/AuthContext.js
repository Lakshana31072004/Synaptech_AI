import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiService } from './apiService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('userProfile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const refreshUserProfile = useCallback(async () => {
    try {
      const profile = await apiService.getCurrentUser();
      setUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
      return profile;
    } catch (e) {
      console.error("Failed to fetch user profile:", e);
      return null;
    }
  }, []);

  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        localStorage.setItem('authToken', token);
        refreshUserProfile();
      } catch (error) {
        console.error("Invalid token:", error);
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userProfile');
      }
    } else {
      setUser(null);
      setUserProfile(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userProfile');
    }
  }, [token, refreshUserProfile]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
  };

  const updateProfilePicture = (newUrl) => {
    setUserProfile(prev => {
      const updated = { ...prev, profilePictureUrl: newUrl, profile_picture_url: newUrl };
      localStorage.setItem('userProfile', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    token,
    user,
    userProfile,
    refreshUserProfile,
    updateProfilePicture,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};