interface RecipeCardProps {
  title: string;
  thumbnail: string;
  cuisine?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
}

function RecipeCard({ title, thumbnail, cuisine, isFavorite, onToggleFavorite, onOpen }: RecipeCardProps) {
  return (
    <div className="flex w-full items-start gap-3 rounded-md border border-gray-700 bg-gray-900 p-3">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 gap-3 text-left">
        <img src={thumbnail} alt="" className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-800 object-cover" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="text-sm font-semibold text-gray-100">{title}</div>
          {cuisine && <div className="font-mono text-xs text-gray-500">{cuisine}</div>}
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
