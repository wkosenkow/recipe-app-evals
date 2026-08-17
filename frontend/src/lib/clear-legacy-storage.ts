// One-time cleanup of localStorage keys that earlier versions of the app wrote
// and nothing reads any more.
//
// `auth-token` is the reason this exists. The session moved into an httpOnly
// cookie, which stopped the app writing the JWT to localStorage — but did
// nothing about the copies already sitting in the browsers of everyone who was
// logged in at deploy time. Those are real, still-valid tokens: exactly the
// XSS-readable exposure the migration was meant to remove, left behind for the
// remainder of their seven-day lifetime.
//
// `kitchen-profile` is merely stale rather than sensitive — the profile moved
// server-side when it became per-user.
//
// Safe to delete this module once no pre-migration token can still be valid.
const LEGACY_KEYS = ["auth-token", "kitchen-profile"];

export const clearLegacyStorage = (): void => {
  try {
    for (const key of LEGACY_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // localStorage can throw in private mode or when disabled by policy. There
    // is nothing to recover here, and failing to clean up must never stop the
    // app from starting.
  }
};
