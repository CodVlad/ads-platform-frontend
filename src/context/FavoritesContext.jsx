import { useState, useEffect, useCallback, createContext } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getFavorites, addFavorite as addFavoriteAPI, removeFavorite as removeFavoriteAPI } from '../api/endpoints';

export const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favorites, setFavorites] = useState([]); // Full ad objects for Favorites page
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();

  // Load favorites from backend (source of truth)
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

  // Add favorite: call API then reload from backend
  const addFavorite = useCallback(async (adId) => {
    try {
      await addFavoriteAPI(adId);
      // Always reload to sync with backend (source of truth)
      await loadFavorites();
      return { success: true, message: 'Added to favorites' };
    } catch (err) {
      // Handle idempotent responses - if already favorited, treat as success
      const backend = err?.response?.data;
      const message = backend?.message || '';
      const errorType = backend?.details?.type || '';
      
      // Check for "ALREADY_FAVORITE" or similar messages
      if (
        err.response?.status === 200 ||
        err.response?.data?.success === true ||
        message.toLowerCase().includes('already') ||
        errorType === 'ALREADY_FAVORITE'
      ) {
        // Treat as success and reload to sync state
        await loadFavorites();
        return { success: true, message: message || 'Already in favorites' };
      }
      
      // For other errors, reload anyway to ensure state is correct
      await loadFavorites();
      throw err;
    }
  }, [loadFavorites]);

  // Remove favorite: call API then reload from backend
  const removeFavorite = useCallback(async (adId) => {
    try {
      await removeFavoriteAPI(adId);
      // Always reload to sync with backend (source of truth)
      await loadFavorites();
      return { success: true, message: 'Removed from favorites' };
    } catch (err) {
      // Handle idempotent responses
      const backend = err?.response?.data;
      const message = backend?.message || '';
      
      if (
        err.response?.status === 200 ||
        err.response?.data?.success === true ||
        message.toLowerCase().includes('not in favorites')
      ) {
        // Treat as success and reload to sync state
        await loadFavorites();
        return { success: true, message: message || 'Removed from favorites' };
      }
      
      // For other errors, reload anyway to ensure state is correct
      await loadFavorites();
      throw err;
    }
  }, [loadFavorites]);

  // Check if ad is favorite
  const isFavorite = useCallback((adId) => {
    if (!adId) return false;
    return favoriteIds.has(String(adId));
  }, [favoriteIds]);

  // Clear favorites (on logout)
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
    isFavorite,
    clearFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};
