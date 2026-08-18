/**
 * The brand mark: a pixel-art stockpot with steam, drawn as one `<rect>` per
 * pixel on a 24×18 grid. Ported from the Kitchenette design mockup.
 *
 * `shapeRendering="crispEdges"` is load-bearing — without it the browser
 * antialiases every rect edge and the pixel art turns to mush at this size.
 *
 * The mockup hard-codes each fill as a hex; every one of them is a step of a
 * Nocturne ramp, so they're written here as the tokens they actually are
 * (steam is the accent, the pot body is neutral-100/200, its shadows
 * neutral-700, the handles neutral-400). Retuning the theme now moves the
 * logo with it.
 */
function Logo() {
  return (
    <svg
      width="30"
      height="23"
      viewBox="0 0 24 18"
      shapeRendering="crispEdges"
      role="img"
      aria-label="Kitchen Companion"
      className="block flex-shrink-0"
    >
      {/* steam */}
      <rect x="9" y="0" width="1" height="1" fill="var(--color-accent)" />
      <rect x="14" y="0" width="1" height="1" fill="var(--color-accent)" />
      <rect x="8" y="1" width="1" height="1" fill="var(--color-accent)" />
      <rect x="15" y="1" width="1" height="1" fill="var(--color-accent)" />
      <rect x="9" y="2" width="1" height="1" fill="var(--color-accent)" />
      <rect x="14" y="2" width="1" height="1" fill="var(--color-accent)" />
      <rect x="10" y="3" width="1" height="1" fill="var(--color-accent)" />
      <rect x="13" y="3" width="1" height="1" fill="var(--color-accent)" />

      {/* lid knob */}
      <rect x="11" y="4" width="2" height="1" fill="var(--color-neutral-400)" />
      <rect x="10" y="5" width="4" height="1" fill="var(--color-neutral-400)" />

      {/* lid */}
      <rect x="5" y="6" width="14" height="1" fill="var(--color-neutral-200)" />
      <rect x="3" y="7" width="18" height="1" fill="var(--color-neutral-100)" />
      <rect x="5" y="8" width="14" height="1" fill="var(--color-neutral-700)" />

      {/* rim and handles */}
      <rect x="0" y="9" width="3" height="1" fill="var(--color-neutral-400)" />
      <rect x="3" y="9" width="18" height="1" fill="var(--color-neutral-200)" />
      <rect x="21" y="9" width="3" height="1" fill="var(--color-neutral-400)" />
      <rect x="0" y="10" width="3" height="1" fill="var(--color-neutral-400)" />
      <rect x="3" y="10" width="18" height="1" fill="var(--color-neutral-200)" />
      <rect x="21" y="10" width="3" height="1" fill="var(--color-neutral-400)" />

      {/* body */}
      <rect x="3" y="11" width="18" height="5" fill="var(--color-neutral-200)" />
      <rect x="4" y="16" width="16" height="1" fill="var(--color-neutral-200)" />
      <rect x="5" y="17" width="14" height="1" fill="var(--color-neutral-700)" />
    </svg>
  );
}

export default Logo;
