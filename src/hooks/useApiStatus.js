import { createContext, useContext } from 'react';

export const ApiStatusContext = createContext(null);

export const useApiStatus = () => {
  const context = useContext(ApiStatusContext);
  if (!context) {
    throw new Error('useApiStatus must be used within an ApiStatusProvider');
  }
  return context;
};

