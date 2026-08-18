import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { KitchenProfileProvider } from './context/KitchenProfileContext'
import { ToastProvider } from './context/ToastContext'
import { clearLegacyStorage } from './lib/clear-legacy-storage'

// Before anything renders, so a leftover token is gone even if the first paint
// throws.
clearLegacyStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Outermost of the app providers: both the favorites and kitchen-profile
          contexts raise toasts, so it has to exist before either of them. */}
      <ToastProvider>
        <AuthProvider>
          <KitchenProfileProvider>
            <FavoritesProvider>
              <App />
            </FavoritesProvider>
          </KitchenProfileProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
