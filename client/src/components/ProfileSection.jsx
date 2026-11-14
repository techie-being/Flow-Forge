import { useState } from "react";
import { flowForgeApi } from "../api/flowForgeApi";

export default function ProfileSection({ currentUser }) {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookupProfile = async (targetUsername) => {
    if (!targetUsername.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await flowForgeApi.getUserProfile(targetUsername.trim());
      setProfile(res.data);
    } catch (err) {
      setProfile(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    lookupProfile(username);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">User Profile Lookup</h3>
          <p className="text-xs text-slate-400">
            Works for guests or signed-in users. Registration initially sets username to your email.
          </p>
        </div>
        {currentUser && (
          <button
            type="button"
            onClick={() => {
              const target = currentUser.username || currentUser.email;
              setUsername(target);
              lookupProfile(target);
            }}
            className="rounded-lg border border-indigo-400/30 bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/25"
          >
            Load My Profile
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="user@example.com"
          className="flex-1 rounded-lg border border-white/10 bg-slate-950/80 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Lookup"}
        </button>
      </form>

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}

      {profile && (
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/80 p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">
              {profile.name || profile.username}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 font-medium ${
                profile.isOwner
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-white/10 text-slate-300"
              }`}
            >
              {profile.isOwner ? "isOwner: true" : "isOwner: false"}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-slate-300">
            <div>
              <dt className="text-slate-500">Username</dt>
              <dd>{profile.username}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email (Owner Only)</dt>
              <dd>{profile.email || "Hidden for guest / non-owner"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd>{profile.role || "user"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">User ID</dt>
              <dd>{profile.id}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}