import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { AuthFrame } from "../components/Layout.jsx";
import { Notice } from "../components/ui.jsx";

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!password.trim()) return setError("Password cannot be empty.");
    setBusy(true);
    try {
      await register(email.trim(), password);
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame title="Create your account">
      <form onSubmit={submit} className="stack">
        <label>Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>Password
          <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <small className="muted">Enter a non-empty password.</small>
        </label>
        <Notice>{error}</Notice>
        <button className="btn primary" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="muted">Already registered? <Link to="/login">Sign in</Link></p>
    </AuthFrame>
  );
}
