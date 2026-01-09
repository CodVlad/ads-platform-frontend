import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getFavorites, addFavorite as addFavoriteAPI, removeFavorite as removeFavoriteAPI } from '../api/endpoints';
import { parseError } from '../utils/errorParser';
import { FavoritesContext } from './favoritesContext';

export const FavoritesProvider = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favorites, setFavorites] = useState([]); // Keep full ad objects for Favorites page
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();

  const loadFavorites = useCallback(async () => {
    if (!token) {
      setFavoriteIds(new Set());
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
      const validFavorites = Array.isArray(favoritesArray) ? favoritesArray : [];
      
      // Build Set from favorite IDs
      const idsSet = new Set();
      validFavorites.forEach((ad) => {
        const id = ad._id || ad.id;
        if (id) {
          idsSet.add(String(id));
        }
      });
      
      setFavoriteIds(idsSet);
      setFavorites(validFavorites);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setFavoriteIds(new Set());
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Add favorite: calls API then reloads from backend
  const addFavorite = useCallback(async (adId) => {
    try {
      const response = await addFavoriteAPI(adId);
      
      // Backend may return {favorited: true} or message "Already in favorites"
      // Always reload to sync with backend (handles "already" case)
      await loadFavorites();
      
      // Check response for message
      const backend = response?.data;
      const message = backend?.message || 'Added to favorites';
      
      return { success: true, message };
    } catch (err) {
      // Check if backend returned success: true even with error status
      if (err.response?.data?.success === true) {
        console.warn("STATUS_MISMATCH", { 
          status: err.response?.status, 
          data: err.response?.data 
        });
        
        // Treat as success and reload to sync
        await loadFavorites();
        const backend = err.response.data;
        const message = backend?.message || 'Added to favorites';
        return { success: true, message };
      }
      
      const backend = err?.response?.data;
      const message = backend?.message || parseError(err);
      
      // If error message includes "Already in favorites", treat as success
      // Still reload to ensure state is in sync
      if (message.toLowerCase().includes('already')) {
        await loadFavorites();
        return { success: true, message };
      }
      
      throw err;
    }
  }, [loadFavorites]);

  // Remove favorite: calls API then reloads from backend
  const removeFavorite = useCallback(async (adId) => {
    try {
      const response = await removeFavoriteAPI(adId);
      
      // Backend may return {favorited: false} or success message
      // Always reload to sync with backend
      await loadFavorites();
      
      // Check response for message
      const backend = response?.data;
      const message = backend?.message || 'Removed from favorites';
      
      return { success: true, message };
    } catch (err) {
      // Check if backend returned success: true even with error status
      if (err.response?.data?.success === true) {
        console.warn("STATUS_MISMATCH", { 
          status: err.response?.status, 
          data: err.response?.data 
        });
        
        // Treat as success and reload to sync
        await loadFavorites();
        const backend = err.response.data;
        const message = backend?.message || 'Removed from favorites';
        return { success: true, message };
      }
      
      // On error, still reload to sync state
      await loadFavorites();
      throw err;
    }
  }, [loadFavorites]);

  const clearFavorites = useCallback(() => {
    setFavoriteIds(new Set());
    setFavorites([]);
  }, []);

  // Load favorites when token exists, clear on logout
  useEffect(() => {
    if (token && user) {
      loadFavorites();
    } else {
      clearFavorites();
    }
  }, [token, user, loadFavorites, clearFavorites]);

  const value = {
    favoriteIds, // Set<string>
    favorites, // Array<Ad> - full ad objects for Favorites page
    loading,
    loadFavorites,
    addFavorite,
    removeFavorite,
    clearFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

