import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * A back control that always has somewhere to go.
 *
 * `navigate(-1)` assumes there is a previous entry, which is exactly what a
 * shared link doesn't have: recipe URLs are this app's shareable unit, and
 * opening one cold gave a "← Back" that either did nothing or left the site
 * entirely. React Router marks the first entry of a session with
 * `location.key === "default"`, so that's the case to catch — in it, go to a
 * sensible parent instead of into the browser's own history.
 */
export function useResolvedBack(fallback: string): () => void {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (location.key === "default") {
      navigate(fallback, { replace: true });
    } else {
      navigate(-1);
    }
  }, [navigate, location.key, fallback]);
}
