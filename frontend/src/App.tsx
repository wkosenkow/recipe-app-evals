import { Route, Routes } from 'react-router-dom'
import RecipesTab from './pages/RecipesTab'
import FavoritesTab from './pages/FavoritesTab'
import MyKitchenTab from './pages/MyKitchenTab'
import RecipeDetail from './pages/RecipeDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<RecipesTab />} />
      <Route path="/favorites" element={<FavoritesTab />} />
      <Route path="/kitchen" element={<MyKitchenTab />} />
      <Route path="/recipes/:id" element={<RecipeDetail />} />
    </Routes>
  )
}

export default App
