import { ForkKnife, VideoCamera } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

// A card in a list has room for the dish's own labels but not for a whole
// tag cloud; past two the row wraps and starts competing with the title.
const MAX_TAGS = 2;

interface RecipeCardProps {
  title: string;
  thumbnail: string;
  cuisine?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  to: string;
  category?: string;
  tags?: string[];
  ingredientCount?: number;
  hasVideo?: boolean;
}

function RecipeCard({
  title,
  thumbnail,
  cuisine,
  isFavorite,
  onToggleFavorite,
  to,
  category,
  tags,
  ingredientCount,
  hasVideo,
}: RecipeCardProps) {
  const shownTags = tags?.slice(0, MAX_TAGS) ?? [];
  // Every one of these is optional by design rather than by accident:
  // TheMealDB's cuisine filter returns only id/name/thumbnail, so a card
  // reached that way genuinely has nothing else to show. Rendering the row
  // only when something lands in it beats printing "0 ingredients" or an
  // empty strip of chips.
  const hasMeta = Boolean(category) || shownTags.length > 0 || Boolean(ingredientCount) || hasVideo;

  return (
    <div className="flex w-full items-start gap-4 rounded-md bg-surface p-4 shadow-sm transition-colors hover:bg-neutral-900">
      {/* A real link, not a button with a navigate() handler: that made the
          one thing people do most with a recipe — open it in a new tab, or
          middle-click a few to compare — quietly impossible. The star stays a
          sibling rather than a child, since nesting a button inside a link is
          invalid markup and leaves the click target ambiguous. */}
      <Link to={to} className="flex min-w-0 flex-1 gap-4 text-left text-text">
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

          {hasMeta && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {category && <span className="tag tag-neutral">{category}</span>}
              {shownTags.map((tag) => (
                <span key={tag} className="tag tag-accent">
                  {tag}
                </span>
              ))}
              {Boolean(ingredientCount) && (
                <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                  <ForkKnife size={13} />
                  {ingredientCount}
                </span>
              )}
              {/* Decorative: "has a video" is already carried by the link on
                  the recipe's own page, so the icon needs no label of its own
                  beyond the title attribute for a sighted hover. */}
              {hasVideo && (
                <span className="flex items-center text-neutral-500" title="Has a video">
                  <VideoCamera size={13} aria-hidden="true" />
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
      {/* A box around the glyph, not a bare 17px character: this sits flush
          against a link covering the rest of the card, and a thumb is about
          45px wide — missing by a few pixels navigated away instead of saving,
          with no undo. `h-11` is 11 spacing steps, so it follows the density:
          44px under a coarse pointer (where it matters) and 30.8px with a
          mouse, which keeps the card compact on desktop. `-my-1` stops the
          taller control from stretching the card's own height. */}
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={`-my-1 grid h-11 w-11 flex-shrink-0 place-items-center text-[22px] leading-none ${
          isFavorite ? "text-accent" : "text-neutral-500 hover:text-neutral-300"
        }`}
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </div>
  );
}

export default RecipeCard;
