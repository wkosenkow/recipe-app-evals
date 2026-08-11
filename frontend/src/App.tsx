import { Route, Routes } from 'react-router-dom'
import RecipesTab from './pages/RecipesTab'

function App() {
  return (
    <Routes>
      <Route path="/" element={<RecipesTab />} />
    </Routes>
  )
}

export default App
