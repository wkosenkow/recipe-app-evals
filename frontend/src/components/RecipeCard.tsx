import { useKitchenProfile } from "../context/KitchenProfileContext";
import { EQUIPMENT_LABELS, type EquipmentKey } from "../types/kitchen";

interface RecipeCardProps {
  title: string;
  thumbnail: string;
  cuisine?: string;
  equipment?: string[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
}

function RecipeCard({ title, thumbnail, cuisine, equipment, isFavorite, onToggleFavorite, onOpen }: RecipeCardProps) {
  const { profile } = useKitchenProfile();

  const missing = equipment?.filter((key) => !profile.equipment[key as EquipmentKey]) ?? null;
  const isReady = missing !== null && missing.length === 0;

  return (
    <div className="flex w-full items-start gap-3 rounded-md border border-gray-700 bg-gray-900 p-3">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 gap-3 text-left">
        <img src={thumbnail} alt="" className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-800 object-cover" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="text-sm font-semibold text-gray-100">{title}</div>
          {cuisine && <div className="font-mono text-xs text-gray-500">{cuisine}</div>}
          {missing !== null && (
            <span className={`text-xs font-semibold ${isReady ? "text-green-500" : "text-red-500"}`}>
              {isReady
                ? "Ready with your kitchen"
                : `Missing ${missing.map((key) => EQUIPMENT_LABELS[key as EquipmentKey] ?? key).join(", ")}`}
            </span>
          )}
        </div>
      </button>
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={`flex-shrink-0 text-lg leading-none ${isFavorite ? "text-yellow-400" : "text-gray-600"}`}
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </div>
  );
}

export default RecipeCard;
