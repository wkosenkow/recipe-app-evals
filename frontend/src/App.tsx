import { Route, Routes } from 'react-router-dom'
import RecipesTab from './pages/RecipesTab'
import FavoritesTab from './pages/FavoritesTab'
import MyKitchenTab from './pages/MyKitchenTab'
import RecipeDetail from './pages/RecipeDetail'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<RecipesTab />} />
      <Route path="/favorites" element={<FavoritesTab />} />
      <Route path="/kitchen" element={<MyKitchenTab />} />
      <Route path="/recipes/:id" element={<RecipeDetail />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
