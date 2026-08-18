import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useKitchenProfile } from "../context/KitchenProfileContext";
import { lookupMealById } from "../lib/mealdb";
import ChatView from "../components/ChatView";
import Footer from "../components/Footer";
import { RecipeDetailSkeleton } from "../components/Skeletons";
import { toIngredientList, toTagList, type MealDBMeal } from "../types/mealdb";

type ViewMode = "card" | "recipe" | "cooking";

// Silkscreen at 9px, the design's section label. Not `.card-kicker` — that one
// is the accent-coloured 10px uppercase variant used on deck cards.
const KICKER = "font-pixel text-[9px] tracking-[0.5px] text-neutral-500";

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useKitchenProfile();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [meal, setMeal] = useState<MealDBMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("card");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    lookupMealById(id)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError("Recipe not found");
          return;
        }
        setMeal(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load recipe");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <RecipeDetailSkeleton />;
  }

  if (error || !meal) {
    return <div className="p-6 text-sm text-danger">{error ?? "Recipe not found"}</div>;
  }

  const ingredients = toIngredientList(meal);

  if (view === "recipe") {
    return (
      <div className="flex min-h-screen flex-col p-6">
        <button
          type="button"
          onClick={() => setView("card")}
          className="mb-4 self-start text-[13px] text-neutral-400 hover:text-neutral-200"
        >
          ← Back to recipe
        </button>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
          <h1 className="m-0 font-heading text-[20px] font-medium text-text">{meal.strMeal}</h1>

          <div className="flex flex-col gap-2">
            <div className={KICKER}>INGREDIENTS</div>
            <ul className="flex flex-col gap-1 text-[13px] leading-[1.7] text-neutral-300">
              {ingredients.map((ingredient, index) => (
                <li key={index}>
                  {ingredient.measure} {ingredient.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <div className={KICKER}>INSTRUCTIONS</div>
            <div className="whitespace-pre-wrap text-[13px] leading-[1.7] text-neutral-300">
              {meal.strInstructions}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "cooking") {
    return (
      <div className="flex h-screen flex-col p-6">
        <button
          type="button"
          onClick={() => setView("card")}
          className="mb-4 self-start text-[13px] text-neutral-400 hover:text-neutral-200"
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
    );
  }

  const favorite = isFavorite(meal.idMeal);
  const tags = toTagList(meal);

  const handleToggleFavorite = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    toggleFavorite(meal.idMeal, meal);
  };

  const handleCookWithAi = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setView("cooking");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="self-start text-[13px] text-neutral-400 hover:text-neutral-200"
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
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            className={`flex-shrink-0 text-[22px] leading-none ${
              favorite ? "text-accent" : "text-neutral-600 hover:text-neutral-400"
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
          <ul className="flex flex-col text-[13px] leading-[1.7] text-neutral-300">
            {ingredients.map((ingredient, index) => (
              <li key={index}>
                {ingredient.measure} {ingredient.name}
              </li>
            ))}
          </ul>
        </div>

        {/* `mt-auto` keeps the pair on the bottom edge when the recipe is short
            enough to leave room, as the mockup has it. The vertical padding is
            larger than the design system's dense default on purpose: at `.btn`
            defaults these land around 28px tall, well under a thumb-sized
            target. */}
        <div className="mt-auto flex gap-3 pt-3">
          <button type="button" onClick={() => setView("recipe")} className="btn btn-secondary flex-1 py-4">
            Recipe
          </button>
          <button type="button" onClick={handleCookWithAi} className="btn btn-primary flex-1 py-4">
            Cook with AI
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default RecipeDetail;
