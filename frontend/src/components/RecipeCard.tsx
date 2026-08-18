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
    <div className="flex w-full items-start gap-4 rounded-md bg-surface p-4 shadow-sm">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 gap-4 text-left">
        {/* alt is empty on purpose: the title sits right beside it, so a
            description here would be announced twice. The neutral-900 ground
            and hairline ring are what shows while the image loads. */}
        <img
          src={thumbnail}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          className="h-20 w-20 flex-shrink-0 rounded-sm bg-neutral-900 object-cover ring-1 ring-neutral-800 ring-inset"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="text-sm font-semibold text-text">{title}</div>
          {cuisine && <div className="font-pixel text-[9px] text-neutral-500">{cuisine}</div>}
        </div>
      </button>
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={`flex-shrink-0 text-[17px] leading-none ${
          isFavorite ? "text-accent" : "text-neutral-600 hover:text-neutral-400"
        }`}
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </div>
  );
}

export default RecipeCard;
