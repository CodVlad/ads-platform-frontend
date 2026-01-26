import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { getUnreadCountCached } from '../api/chat';
import { ChatNotificationsContext } from './ChatNotificationsContext.js';
import { useToast } from '../hooks/useToast';

export const ChatNotificationsProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();
  const { error: showError } = useToast();
  const pollIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const refreshUnreadCount = useCallback(async (retryAfterMs = null) => {
    // If no token, set count to 0
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      // Use cached version to avoid calling on every navigation
      const response = await getUnreadCountCached();
      const count = response.data?.count || response.data?.unreadCount || 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
      
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    } catch (err) {
      // Handle 401 (unauthorized) - user logged out or token invalid
      if (err?.response?.status === 401) {
        setUnreadCount(0);
        return;
      }
      
      // Handle 429 (rate limit) with retry
      if (err?.type === 'RATE_LIMIT' || err?.response?.status === 429) {
        const retryAfter = err.retryAfterMs || 1500;
        const retryAfterSeconds = Math.ceil(retryAfter / 1000);
        
        // Show friendly toast
        showError(`Too many requests. Retrying in ${retryAfterSeconds}s...`);
        
        // Automatically retry once after retryAfterMs or 1500ms fallback
        retryTimeoutRef.current = setTimeout(() => {
          refreshUnreadCount();
        }, retryAfter);
        
        return;
      }
      
      // For other errors, don't spam console, just keep current count
      // This prevents breaking the app if backend is down
    }
  }, [token, showError]);

  // Refresh on mount if token exists
  useEffect(() => {
    if (token) {
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
    
    // Cleanup retry timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [token, refreshUnreadCount]);

  // Polling every 30 seconds if token exists
  useEffect(() => {
    if (token) {
      pollIntervalRef.current = setInterval(() => {
        refreshUnreadCount();
      }, 30000); // 30 seconds

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    } else {
      // Clear interval if token is removed
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      setUnreadCount(0);
    }
  }, [token, refreshUnreadCount]);

  const value = {
    unreadCount,
    refreshUnreadCount,
  };

  return (
    <ChatNotificationsContext.Provider value={value}>
      {children}
    </ChatNotificationsContext.Provider>
  );
};

