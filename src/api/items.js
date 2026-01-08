import api from './client';

export const getItems = () => {
  return api.get('/api/items');
};

