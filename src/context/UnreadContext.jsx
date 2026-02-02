import { createContext, useContext, useState } from 'react';

const UnreadContext = createContext(null);

export const UnreadProvider = ({ children }) => {
  const [totalUnread, setTotalUnread] = useState(0);

  return (
    <UnreadContext.Provider value={{ totalUnread, setTotalUnread }}>
      {children}
    </UnreadContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- hook + provider in same file
export const useUnread = () => {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error('useUnread must be used within UnreadProvider');
  }
  return context;
};
