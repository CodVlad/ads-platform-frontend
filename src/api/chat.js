import api from './client';

export const startChat = (adId, receiverId) => {
  return api.post('/chats/start', { adId, receiverId });
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

