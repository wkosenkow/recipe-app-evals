import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

interface PendingState {
  pendingFavorite?: string;
}

/**
 * Finishes a save that a guest started before signing in.
 *
 * Tapping the star while logged out used to navigate to /login and drop the
 * intention on the floor: after signing in you landed wherever login sends
 * people, with the recipe gone and — on a phone — a search to retype. The
 * star now sends the meal id along, login hands it back, and whichever screen
 * receives it completes the save.
 *
 * The state is cleared immediately afterwards so a reload or a back-forward
 * step doesn't re-apply it, and the save is skipped when the recipe is
 * already saved: this should finish the original intention, never toggle it
 * back off.
 */
export function usePendingFavorite(): void {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const pending = (location.state as PendingState | null)?.pendingFavorite;

  useEffect(() => {
    if (!pending || !user) return;

    if (!isFavorite(pending)) {
      void toggleFavorite(pending);
    }
    navigate(location.pathname + location.search, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, user]);
}
