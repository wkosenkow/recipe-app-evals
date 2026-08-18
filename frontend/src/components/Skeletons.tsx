/**
 * Loading placeholders that mirror the geometry of the thing they stand in
 * for, so the real content lands in the space already reserved for it rather
 * than shoving the page down as it arrives.
 *
 * Each one is `aria-hidden` and paired with a single `role="status"` label:
 * the shapes are meaningless read aloud, and a screen reader wants "Loading
 * recipes", not eight identical empty groups.
 */

// The one grey used for every placeholder shape — the same ground the recipe
// thumbnails sit on while they load, so a half-loaded list reads as one
// state rather than two competing ones.
const BLOCK = "rounded-sm bg-neutral-900";

function RecipeCardSkeleton() {
  return (
    // Geometry deliberately copied from RecipeCard: same padding, same 56px
    // thumbnail, same gaps. If that card's layout changes, this must follow —
    // a skeleton that doesn't match its own content is worse than none, since
    // the page still jumps when the swap happens.
    <div className="flex w-full items-start gap-4 rounded-md bg-surface p-4 shadow-sm">
      <div className={`h-20 w-20 flex-shrink-0 ${BLOCK}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
        <div className={`h-4 w-2/3 ${BLOCK}`} />
        <div className={`h-2 w-1/4 ${BLOCK}`} />
        <div className="mt-1 flex gap-2">
          <div className={`h-4 w-14 ${BLOCK}`} />
          <div className={`h-4 w-10 ${BLOCK}`} />
        </div>
      </div>
    </div>
  );
}

export function RecipeListSkeleton({ count = 6, label = "Loading recipes" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex animate-pulse flex-col gap-3">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex flex-col gap-3">
        {Array.from({ length: count }, (_, index) => (
          <RecipeCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen animate-pulse flex-col">
      <span className="sr-only">Loading recipe</span>
      <div aria-hidden="true" className="flex flex-1 flex-col gap-4 p-6">
        <div className={`h-3 w-16 ${BLOCK}`} />
        {/* Matches RecipeDetail's hero height exactly, which is the single
            biggest source of shift on this screen. */}
        <div className={`h-[172px] w-full rounded-md bg-neutral-900`} />
        <div className={`h-6 w-3/4 ${BLOCK}`} />
        <div className="flex gap-3">
          <div className={`h-5 w-20 ${BLOCK}`} />
          <div className={`h-5 w-16 ${BLOCK}`} />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <div className={`h-2 w-24 ${BLOCK}`} />
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={`h-3 w-full ${BLOCK}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
