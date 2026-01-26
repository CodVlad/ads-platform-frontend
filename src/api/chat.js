import api from './client';

export const startChat = (receiverId, adId) => {
  // Validate receiverId: must be a valid non-empty string
  if (!receiverId || typeof receiverId !== 'string' || receiverId.trim() === '') {
    return Promise.reject(new Error('Receiver ID is required and must be a valid string'));
  }

  // Validate adId: must be a valid non-empty string (Mongo ObjectId format or at least non-empty)
  if (!adId || typeof adId !== 'string' || adId.trim() === '') {
    return Promise.reject(new Error('Ad ID is required and must be a valid string'));
  }

  // Request body must be EXACT: { receiverId, adId }
  return api.post('/chats/start', { receiverId, adId });
};

export const getChats = () => {
  return api.get('/chats');
};

export const getMessages = (conversationId) => {
  return api.get(`/chats/${conversationId}/messages`);
};

export const sendMessage = (conversationId, text) => {
  return api.post(`/chats/${conversationId}/messages`, { text });
};

// Cache for unread-count (30 seconds)
let unreadCountCache = null;
let unreadCountCacheTime = 0;
const UNREAD_COUNT_CACHE_MS = 30000; // 30 seconds

export const getUnreadCount = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Return a promise that resolves to 0 if no token
    return Promise.resolve({ data: { count: 0 } });
  }
  return api.get('/chats/unread-count');
};

/**
 * Get unread count with 30 second cache
 * @returns {Promise<{data: {count: number}}>}
 */
export const getUnreadCountCached = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return Promise.resolve({ data: { count: 0 } });
  }
  
  const now = Date.now();
  
  // Return cached result if still valid (within 30 seconds)
  if (unreadCountCache && (now - unreadCountCacheTime) < UNREAD_COUNT_CACHE_MS) {
    return unreadCountCache;
  }
  
  // Fetch and cache
  try {
    const response = await api.get('/chats/unread-count');
    unreadCountCache = response;
    unreadCountCacheTime = now;
    return response;
  } catch (error) {
    // If error, return cached value if available, otherwise throw
    if (unreadCountCache) {
      return unreadCountCache;
    }
    throw error;
  }
};
