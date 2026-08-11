import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { FavoritesProvider } from './context/FavoritesContext'
import { KitchenProfileProvider } from './context/KitchenProfileContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <KitchenProfileProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </KitchenProfileProvider>
    </BrowserRouter>
  </StrictMode>,
)
