import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import Logo from "../components/Logo";

function SignUpPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      <Logo />
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="m-0 font-heading text-[20px] font-medium text-text">Sign up</h1>

        <div className="field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            // "new-password" rather than "current-password" is what tells a
            // password manager to offer to generate and save one.
            autoComplete="new-password"
            required
          />
          <div className="mt-2 text-xs text-neutral-500">At least 8 characters.</div>
        </div>

        {error && (
          <div role="alert" className="text-sm text-danger">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-block py-4">
          {loading ? "Signing up…" : "Sign up"}
        </button>

        <div className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}

export default SignUpPage;
