import { useState } from "react";
import { flowForgeApi } from "../api/flowForgeApi";

export default function AuthSection({ user, loading, onAuthChange }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatusMsg("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        const res = await flowForgeApi.login(email, password);
        const userData = res.data?.user || (res.data?.email ? res.data : null);
        if (userData) {
          onAuthChange(userData);
        } else {
          const meRes = await flowForgeApi.getCurrentUser();
          onAuthChange(meRes.data);
        }
      } else {
        await flowForgeApi.register(email, password);
        const meRes = await flowForgeApi.getCurrentUser();
        onAuthChange(meRes.data);
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    setStatusMsg("");
    try {
      await flowForgeApi.logout();
      onAuthChange(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRotateTokens = async () => {
    setError("");
    setStatusMsg("");
    try {
      const res = await flowForgeApi.refreshToken();
      const meRes = await flowForgeApi.getCurrentUser();
      onAuthChange(meRes.data);
      setStatusMsg(res.message || "Access and refresh tokens rotated.");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-xs text-slate-300 backdrop-blur-md">
        Checking HTTP-only cookie session...
      </div>
    );
  }

  if (user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
              Active Cookie Session
            </span>
            <h2 className="mt-1.5 text-base font-semibold text-white">{user.email}</h2>
            <p className="text-xs text-slate-400">
              ID: <span className="text-slate-200">{user.id}</span> &bull; Username:{" "}
              <span className="text-slate-200">{user.username || user.email}</span> &bull; Role:{" "}
              <span className="text-slate-200">{user.role || "user"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRotateTokens}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/15"
            >
              Rotate Tokens
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
            >
              Logout
            </button>
          </div>
        </div>
        {statusMsg && <p className="mt-3 text-xs text-emerald-400">{statusMsg}</p>}
        {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-md">
      <div className="mb-5 flex rounded-lg bg-slate-950/90 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError("");
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
            mode === "login" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError("");
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
            mode === "register" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="StrongPassword123"
            className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}