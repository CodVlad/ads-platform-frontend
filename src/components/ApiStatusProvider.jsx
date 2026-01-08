import { useState, useCallback, useEffect, useRef } from 'react';
import { registerLoadingCallback } from '../utils/apiStatus';
import { ApiStatusContext } from '../hooks/useApiStatus';

export const ApiStatusProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const requestCountRef = useRef(0);

  const setApiLoading = useCallback((isLoading) => {
    if (isLoading) {
      requestCountRef.current += 1;
    } else {
      requestCountRef.current = Math.max(0, requestCountRef.current - 1);
    }
    setLoading(requestCountRef.current > 0);
  }, []);

  useEffect(() => {
    registerLoadingCallback(setApiLoading);
  }, [setApiLoading]);

  const value = {
    loading,
    setApiLoading,
  };

  return (
    <ApiStatusContext.Provider value={value}>
      {children}
      {loading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: '#007bff',
            zIndex: 9999,
            animation: 'loadingBar 1.5s ease-in-out infinite',
          }}
        >
          <style>
            {`
              @keyframes loadingBar {
                0% {
                  transform: translateX(-100%);
                }
                50% {
                  transform: translateX(0%);
                }
                100% {
                  transform: translateX(100%);
                }
              }
            `}
          </style>
        </div>
      )}
    </ApiStatusContext.Provider>
  );
};

