import { useParams } from "react-router-dom";

import { useResolvedBack } from "../lib/use-resolved-back";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useRecipe, KICKER } from "./recipe-shared";

function RecipeTextView() {
  const { id } = useParams<{ id: string }>();
  const { meal, ingredients } = useRecipe();
  // "Back to recipe" means the card, so that's where a cold load lands —
  // reaching this screen by its own URL is now possible and shouldn't dead-end.
  const goBack = useResolvedBack(`/recipes/${id}`);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="flex flex-1 flex-col p-6">
        <button
          type="button"
          onClick={goBack}
          className="mb-4 -mt-2 self-start py-2 text-[13px] text-neutral-400 hover:text-neutral-200"
        >
          ← Back to recipe
        </button>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
          <h1 className="m-0 font-heading text-[20px] font-medium text-text">{meal.strMeal}</h1>

          {/* 16px, not the 13px this used to be. It's the screen a cook stares
              at longest, read from a phone propped behind a mixing bowl rather
              than held at arm's length, and it was set smaller than the app's
              own 15px body. neutral-200 over neutral-300 for the same reason. */}
          <div className="flex flex-col gap-2">
            <div className={KICKER}>INGREDIENTS</div>
            <ul className="flex flex-col gap-1 text-base leading-[1.7] text-neutral-200">
              {ingredients.map((ingredient, index) => (
                <li key={index}>
                  {ingredient.measure} {ingredient.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <div className={KICKER}>INSTRUCTIONS</div>
            <div className="whitespace-pre-wrap text-base leading-[1.7] text-neutral-200">{meal.strInstructions}</div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default RecipeTextView;
