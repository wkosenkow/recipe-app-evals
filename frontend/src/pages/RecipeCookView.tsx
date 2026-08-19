import { Navigate, useLocation, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useKitchenProfile } from "../context/KitchenProfileContext";
import { useResolvedBack } from "../lib/use-resolved-back";
import BottomNav from "../components/BottomNav";
import ChatView from "../components/ChatView";
import Header from "../components/Header";
import { useRecipe } from "./recipe-shared";

function RecipeCookView() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { profile } = useKitchenProfile();
  const { meal, ingredients } = useRecipe();
  const goBack = useResolvedBack(`/recipes/${id}`);

  // Waiting on `loading` is what makes this survive a reload. The session is
  // an httpOnly cookie the client can't read, so `user` is null until
  // /api/auth/me answers — redirecting before then would bounce a signed-in
  // cook to the login screen every time they refreshed mid-walkthrough.
  if (loading) {
    return <div className="p-6 text-sm text-neutral-500">Loading…</div>;
  }

  // The guard now lives on the route rather than only on the button that used
  // to reach it: this screen has its own URL, so it has to turn guests away
  // itself. `replace` keeps the chat out of history — going back from the
  // login screen should return to the recipe, not bounce through here again.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    // `h-dvh` rather than `min-h-dvh`: this screen must not grow past the
    // viewport, because the chat scrolls inside itself. With the header and
    // the tab bar taking fixed bands off the top and bottom, `min-h-0` on the
    // middle section is what allows it to shrink far enough for its own
    // overflow to engage instead of pushing the compose row off screen.
    <div className="flex h-dvh flex-col">
      <Header />
      {/* `pb-3` is not decoration: without it the compose row ends flush
          against the tab bar's top edge — measured at a 1px overlap — and the
          Send button's border disappears into it. */}
      <div className="flex min-h-0 flex-1 flex-col px-6 pt-4 pb-3">
        <button
          type="button"
          onClick={goBack}
          className="mb-4 -mt-2 self-start py-2 text-[13px] text-neutral-400 hover:text-neutral-200"
        >
          ← Back to recipe
        </button>
        <ChatView
          recipe={{
            title: meal.strMeal,
            cuisine: meal.strArea,
            ingredients,
            instructions: meal.strInstructions,
          }}
          kitchenProfile={profile}
          mealId={meal.idMeal}
        />
      </div>
      <BottomNav />
    </div>
  );
}

export default RecipeCookView;
