import { Fragment, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api.js";
import { useAuth, displayName } from "../auth/AuthContext.jsx";
import { Notice } from "../components/ui.jsx";

const MAX_AVATAR_BYTES = 500 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export default function Account() {
  const { user, logout, reloadUser, updateProfile } = useAuth();
  const nav = useNavigate();
  const avatarInput = useRef(null);
  const [fullname, setFullname] = useState(user.name || "");
  const [avatar, setAvatar] = useState(null);
  const [msg, setMsg] = useState({ kind: "ok", text: "" });
  const [busy, setBusy] = useState("");

  function chooseAvatar(event) {
    const file = event.target.files?.[0] || null;
    setMsg({ kind: "error", text: "" });
    if (file && !AVATAR_TYPES.has(file.type)) {
      event.target.value = "";
      setAvatar(null);
      setMsg({ kind: "error", text: "Choose a JPEG, PNG, WebP, or GIF image." });
      return;
    }
    if (file && file.size > MAX_AVATAR_BYTES) {
      event.target.value = "";
      setAvatar(null);
      setMsg({ kind: "error", text: "The image must be 500 KB or smaller." });
      return;
    }
    setAvatar(file);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setMsg({ kind: "ok", text: "" });
    if (!fullname.trim()) {
      setMsg({ kind: "error", text: "Full name is required." });
      return;
    }
    if (!avatar) {
      setMsg({ kind: "error", text: "Choose an image to upload." });
      return;
    }

    setBusy("profile");
    try {
      await updateProfile(fullname.trim(), avatar);
      setAvatar(null);
      if (avatarInput.current) avatarInput.current.value = "";
      setMsg({ kind: "ok", text: "Profile updated." });
    } catch (error) {
      setMsg({ kind: "error", text: error.message });
    } finally {
      setBusy("");
    }
  }

  async function refresh() {
    setBusy("refresh");
    try {
      await api.refresh();
      await reloadUser();
      setMsg({ kind: "ok", text: "Session refreshed" });
    } catch (e) {
      setMsg({ kind: "error", text: e.message });
    } finally { setBusy(""); }
  }
  async function signOut() {
    setBusy("out");
    try { await logout(); } catch { /* cookies are cleared locally either way */ }
    nav("/login", { replace: true });
  }

  const handle = user.username || user.email;
  const rows = [["Email", user.email], ["Username", user.username], ["Name", user.name], ["Role", user.role], ["User ID", user.id]]
    .filter(([, v]) => v !== undefined && v !== null && v !== "");

  return (
    <div className="page">
      <header className="page-head"><h1>{displayName(user)}</h1></header>
      <section className="panel">
        {(user.profile_image_url || user.profile_image) && (
          <img className="avatar" src={user.profile_image_url || user.profile_image} alt="" />
        )}
        <dl className="facts">{rows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{String(v)}</dd></Fragment>)}</dl>
        <form className="stack account-profile-form" onSubmit={saveProfile}>
          <h2>Update profile</h2>
          <label>Full name
            <input value={fullname} onChange={(event) => setFullname(event.target.value)} required />
          </label>
          <label>Profile image
            <input
              ref={avatarInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={chooseAvatar}
              required
            />
            <small className="muted">
              JPEG, PNG, WebP, or GIF; maximum 500 KB. The backend requires a new image when saving profile details.
            </small>
          </label>
          <Notice kind={msg.kind}>{msg.text}</Notice>
          <div>
            <button className="btn primary" disabled={!!busy}>
              {busy === "profile" ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
        <div className="actions">
          {handle && <Link className="btn" to={`/u/${encodeURIComponent(handle)}`}>View public profile</Link>}
          <button className="btn" onClick={refresh} disabled={!!busy}>{busy === "refresh" ? "Refreshing…" : "Refresh session"}</button>
          <button className="btn danger" onClick={signOut} disabled={!!busy}>{busy === "out" ? "Signing out…" : "Sign out"}</button>
        </div>
        <p className="muted small">Your session lasts 15 minutes per access token and renews automatically for up to 7 days.</p>
      </section>
    </div>
  );
}
