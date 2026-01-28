import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext.jsx'
import { ChatNotificationsProvider } from './context/ChatNotificationsContext.jsx'
import { UnreadProvider } from './context/UnreadContext.jsx'
import { ToastProvider } from './components/ToastProvider'
import { ApiStatusProvider } from './components/ApiStatusProvider'
import './index.css'
import './styles/ui.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ApiStatusProvider>
        <ToastProvider>
          <AuthProvider>
            <UnreadProvider>
              <ChatNotificationsProvider>
                <FavoritesProvider>
                  <App />
                </FavoritesProvider>
              </ChatNotificationsProvider>
            </UnreadProvider>
          </AuthProvider>
        </ToastProvider>
      </ApiStatusProvider>
    </HashRouter>
  </StrictMode>,
)
