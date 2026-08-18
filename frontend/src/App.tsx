import { Route, Routes } from "react-router-dom";

import RecipesTab from "./pages/RecipesTab";
import FavoritesTab from "./pages/FavoritesTab";
import MyKitchenTab from "./pages/MyKitchenTab";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeCardView from "./pages/RecipeCardView";
import RecipeTextView from "./pages/RecipeTextView";
import RecipeCookView from "./pages/RecipeCookView";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RecipesTab />} />
      <Route path="/favorites" element={<FavoritesTab />} />
      <Route path="/kitchen" element={<MyKitchenTab />} />

      {/* The recipe's three screens are sibling routes under one layout that
          owns the fetch, rather than one component switching on `view` state.
          Each is addressable, so the back gesture steps between them, a reload
          keeps the cook where they were, and "continue cooking" is a link
          something else can point at. */}
      <Route path="/recipes/:id" element={<RecipeDetail />}>
        <Route index element={<RecipeCardView />} />
        <Route path="recipe" element={<RecipeTextView />} />
        <Route path="cook" element={<RecipeCookView />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
