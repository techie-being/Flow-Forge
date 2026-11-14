import { Fragment } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api.js";
import { Loading, Notice, useLoad } from "../components/ui.jsx";

export default function Profile() {
  const { username } = useParams(); // react-router decodes the URL segment for us
  const { data, error, loading } = useLoad(() => api.profile(username), [username]);

  if (loading) return <Loading />;
  if (error) return <div className="page"><Notice>{error.status === 404 ? "No profile with that username." : error.message}</Notice></div>;

  const p = data?.user ?? data ?? {};
  const isOwner = Boolean(data?.isOwner ?? p.isOwner);
  const rows = [["Username", p.username], ["Name", p.name], ["Email", isOwner ? p.email : null]]
    .filter(([, v]) => v);

  return (
    <div className="page">
      <header className="page-head">
        <h1>{p.name || p.username || username}</h1>
        {isOwner && <span className="tag">This is you</span>}
      </header>
      <section className="panel">
        {(p.profile_image_url || p.profile_image) && (
          <img className="avatar" src={p.profile_image_url || p.profile_image} alt="" />
        )}
        <dl className="facts">{rows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>
        {!isOwner && <p className="muted small">Email addresses are only shown to the profile owner.</p>}
      </section>
    </div>
  );
}
