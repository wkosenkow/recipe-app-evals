import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import Logo from "../components/Logo";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Logo />
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="m-0 font-heading text-[20px] font-medium text-text">Log in</h1>

        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="input"
            type="email"
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
          <input
            id="login-password"
            className="input"
            type="password"
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
          <Link to="/signup" className="font-semibold">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
