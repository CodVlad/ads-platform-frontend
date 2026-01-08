import http from './http';

export const getItems = () => {
  return http.get('/api/items');
};

