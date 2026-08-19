import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import Logo from "../components/Logo";

interface LoginState {
  from?: string;
  pendingFavorite?: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Whoever sent the guest here says where they were and, if they were part
  // way through saving a recipe, which one. Both are handed straight back.
  const { from, pendingFavorite } = (location.state as LoginState | null) ?? {};

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // `replace`, so the back gesture from the restored screen doesn't land
      // on a login form the cook has already used.
      navigate(from ?? "/", { replace: true, state: pendingFavorite ? { pendingFavorite } : null });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      {/* This screen carries no header, so without this the mark is the only
          thing on it and there's no way back into the app but the browser's
          own back button. */}
      <Link to="/" aria-label="Kitchen Companion — home">
        <Logo />
      </Link>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="m-0 font-heading text-[20px] font-medium text-text">Log in</h1>

        <div className="field">
          <label htmlFor="login-email">Email</label>
          {/* `inputMode="email"` puts @ and . on the main layer of the phone
              keyboard instead of behind a layout switch; the capitalisation
              and autocorrect defaults would otherwise fight an address. */}
          <input
            id="login-email"
            className="input"
            type="email"
            inputMode="email"
            enterKeyHint="next"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            // Lets a password manager recognise the pair and offer the saved
            // credentials instead of the user retyping them.
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="login-password">Password</label>
          {/* "go" rather than "next": this is the last field, and the key
              submits the form. */}
          <input
            id="login-password"
            className="input"
            type="password"
            enterKeyHint="go"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div role="alert" className="text-sm text-danger">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-block py-4">
          {loading ? "Logging in…" : "Log in"}
        </button>

        <div className="text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          {/* Carries the intent across, so a guest who signs up instead of
              logging in still lands back where they started. */}
          <Link to="/signup" state={location.state} className="font-semibold">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
