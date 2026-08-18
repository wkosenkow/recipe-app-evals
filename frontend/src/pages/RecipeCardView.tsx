import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useResolvedBack } from "../lib/use-resolved-back";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { toTagList } from "../types/mealdb";
import { useRecipe, KICKER } from "./recipe-shared";

function RecipeCardView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { meal, ingredients } = useRecipe();
  // A recipe link is what people share, so this screen is routinely the first
  // one a session sees — hence the list rather than the browser's history.
  const goBack = useResolvedBack("/");

  const favorite = isFavorite(meal.idMeal);
  const tags = toTagList(meal);

  const handleToggleFavorite = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    toggleFavorite(meal.idMeal, meal);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* The shell was missing here entirely: opening a shared recipe cold gave
          a screen with no tabs at all, and no way to reach the rest of the
          app. */}
      <Header />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <button
          type="button"
          onClick={goBack}
          className="-my-2 self-start py-2 text-[13px] text-neutral-400 hover:text-neutral-200"
        >
          ← Back
        </button>

        {/* Not lazy-loaded: this is the screen's hero, so deferring it would
            only delay the largest paint. */}
        <img
          src={meal.strMealThumb}
          alt=""
          className="h-[172px] w-full rounded-md bg-neutral-900 object-cover ring-1 ring-neutral-800 ring-inset"
        />

        <div className="flex items-start justify-between gap-4">
          <h1 className="m-0 font-heading text-[20px] font-medium text-text">{meal.strMeal}</h1>
          {/* Same sizing story as the card's star — see RecipeCard. `-m-2`
              pulls the padded box back so the glyph still lines up with the
              title's cap height rather than sitting low. */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            className={`-m-2 grid h-11 w-11 flex-shrink-0 place-items-center text-[22px] leading-none ${
              favorite ? "text-accent" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {favorite ? "★" : "☆"}
          </button>
        </div>

        {/* Where the dish is from and what it is are facts about the recipe, so
            they take the neutral tag; the source's own tags are editorial, so
            they take the accent. */}
        <div className="flex flex-wrap gap-3">
          <span className="tag tag-neutral">{meal.strArea}</span>
          <span className="tag tag-neutral">{meal.strCategory}</span>
          {tags.map((tag) => (
            <span key={tag} className="tag tag-accent">
              {tag}
            </span>
          ))}
        </div>

        {(meal.strYoutube || meal.strSource) && (
          <div className="flex flex-wrap gap-6 text-xs font-semibold">
            {meal.strYoutube && (
              <a href={meal.strYoutube} target="_blank" rel="noreferrer">
                ▶ Watch video
              </a>
            )}
            {meal.strSource && (
              <a href={meal.strSource} target="_blank" rel="noreferrer">
                ↗ View original recipe
              </a>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2">
          <div className={KICKER}>INGREDIENTS</div>
          <ul className="flex flex-col text-base leading-[1.7] text-neutral-200">
            {ingredients.map((ingredient, index) => (
              <li key={index}>
                {ingredient.measure} {ingredient.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Links, not buttons: these are now addressable screens, so they
            should behave like every other link in the app — openable in a new
            tab, and reachable by the back gesture afterwards.

            `mt-auto` keeps the pair on the bottom edge when the recipe is short
            enough to leave room, as the mockup has it. `py-4` stays even though
            `.btn` now has a 44px floor: that floor only applies to coarse
            pointers, and without the padding these fall back to about 28px on
            desktop — too small for the screen's primary action either way. */}
        <div className="mt-auto flex gap-3 pt-3">
          <Link to="recipe" className="btn btn-secondary flex-1 py-4">
            Recipe
          </Link>
          {/* Guests get sent to the login screen rather than to a chat that
              would 401 — the cook route enforces the same rule on arrival, so
              this is the friendly path to it, not the only one. */}
          <Link to={user ? "cook" : "/login"} className="btn btn-primary flex-1 py-4">
            Cook with AI
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default RecipeCardView;
