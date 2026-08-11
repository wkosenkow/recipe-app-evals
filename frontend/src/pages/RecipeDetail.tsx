import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useFavorites } from "../context/FavoritesContext";
import { useKitchenProfile } from "../context/KitchenProfileContext";
import { apiGet } from "../lib/api";
import { buildInstructionsText, missingEquipment } from "../lib/recipe-logic";
import TabBar from "../components/TabBar";
import { EQUIPMENT_LABELS, type EquipmentKey } from "../types/kitchen";
import type { Recipe } from "../types/recipe";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
}

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useKitchenProfile();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    apiGet<{ recipe: Recipe }>(`/api/recipes/${id}`)
      .then((data) => {
        if (!cancelled) setRecipe(data.recipe);
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
    return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  }

  if (error || !recipe) {
    return <div className="p-4 text-sm text-red-500">{error ?? "Recipe not found"}</div>;
  }

  const missing = missingEquipment(recipe, profile.equipment);
  const missingLabels = missing.map((key) => EQUIPMENT_LABELS[key as EquipmentKey] ?? key);
  const isReady = missing.length === 0;
  const favorite = isFavorite(recipe._id);

  if (isCooking) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-950 p-4">
        <button
          type="button"
          onClick={() => setIsCooking(false)}
          className="mb-4 self-start text-sm text-gray-400"
        >
          ← Back to recipe
        </button>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className="max-w-[85%] self-start whitespace-pre-wrap rounded-lg border border-gray-700 bg-gray-900 p-3 text-sm leading-relaxed text-gray-100"
            >
              {message.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <button type="button" onClick={() => navigate(-1)} className="self-start text-sm text-gray-400">
          ← Back
        </button>

        <div className="h-48 w-full rounded-md bg-gray-800" />

        <div className="flex items-start justify-between gap-3">
          <div className="text-xl font-semibold text-gray-100">{recipe.title}</div>
          <button
            type="button"
            onClick={() => toggleFavorite(recipe._id)}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            className={`text-2xl leading-none ${favorite ? "text-yellow-400" : "text-gray-600"}`}
          >
            {favorite ? "★" : "☆"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
            {recipe.cuisine}
          </span>
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
            {recipe.time} min
          </span>
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
            {recipe.difficulty}
          </span>
        </div>

        <p className="text-sm text-gray-400">{recipe.description}</p>

        <div
          className={`rounded-md border px-3 py-2 text-xs font-semibold ${
            isReady
              ? "border-green-500/40 bg-green-500/15 text-green-400"
              : "border-red-500/40 bg-red-500/15 text-red-400"
          }`}
        >
          {isReady ? "Ready with your kitchen" : `Missing ${missingLabels.join(", ")}`}
        </div>

        <button
          type="button"
          onClick={() => {
            setMessages([{ role: "assistant", text: buildInstructionsText(recipe, profile) }]);
            setIsCooking(true);
          }}
          className="mt-2 rounded-md bg-blue-500 px-4 py-3 text-sm font-semibold text-white"
        >
          Cook
        </button>
      </div>

      <TabBar />
    </div>
  );
}

export default RecipeDetail;
