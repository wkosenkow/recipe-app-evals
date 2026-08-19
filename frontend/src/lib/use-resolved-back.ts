import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * A back control that always has somewhere to go.
 *
 * `navigate(-1)` assumes there is a previous entry, which is exactly what a
 * shared link doesn't have: recipe URLs are this app's shareable unit, and
 * opening one cold gives a "← Back" that would otherwise leave the site.
 *
 * The signal is React Router's own index, which it keeps in `history.state`.
 * `idx === 0` means this entry is the first of the session, so there is
 * nothing of ours behind it and the fallback is the only sane destination.
 *
 * It is read fresh on each click rather than from `useLocation`, because the
 * question is about the history stack at the moment of the press, not about
 * the render that produced the button.
 *
 * `location.key === "default"` was the obvious check and is subtly wrong. It
 * describes the *entry*, not the stack, so it stops being true as soon as one
 * of these fallbacks runs: the replacement entry gets a freshly generated key
 * while still sitting at `idx === 0`. Two backs in a row from a cold deep link
 * — `/recipes/x/recipe` → `/recipes/x` → out — therefore walked straight off
 * the site, which is the exact failure this hook exists to prevent.
 */
export function useResolvedBack(fallback: string): () => void {
  const navigate = useNavigate();

  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;

    if (idx === 0) {
      navigate(fallback, { replace: true });
    } else {
      navigate(-1);
    }
  }, [navigate, fallback]);
}
