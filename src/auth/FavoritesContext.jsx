import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFavorites } from '../api/endpoints';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();

  // Derived favoriteIds array
  const favoriteIds = favorites.map((ad) => ad._id || ad.id).filter(Boolean);

  const loadFavorites = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getFavorites();
      
      // Normalize response - try multiple paths to extract array
      let favoritesArray = [];
      const data = response.data;
      
      if (data?.ads && Array.isArray(data.ads)) {
        favoritesArray = data.ads;
      } else if (data?.data?.ads && Array.isArray(data.data.ads)) {
        favoritesArray = data.data.ads;
      } else if (data?.data && Array.isArray(data.data)) {
        favoritesArray = data.data;
      } else if (data?.items && Array.isArray(data.items)) {
        favoritesArray = data.items;
      } else if (Array.isArray(data)) {
        favoritesArray = data;
      }

      // Ensure favorites is always an array
      setFavorites(Array.isArray(favoritesArray) ? favoritesArray : []);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const addToFavorites = (ad) => {
    setFavorites((prev) => {
      // Check if ad already exists by _id or id
      const adId = ad._id || ad.id;
      const exists = prev.some((fav) => (fav._id || fav.id) === adId);
      if (!exists) {
        return [...prev, ad];
      }
      return prev;
    });
  };

  const removeFromFavorites = (adId) => {
    setFavorites((prev) => prev.filter((ad) => (ad._id || ad.id) !== adId));
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  // Load favorites when token exists, clear on logout
  useEffect(() => {
    if (token && user) {
      loadFavorites();
    } else {
      clearFavorites();
    }
  }, [token, user, loadFavorites]);

  const value = {
    favorites,
    favoriteIds,
    loading,
    loadFavorites,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
