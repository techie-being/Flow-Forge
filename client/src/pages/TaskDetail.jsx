import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api.js";
import { ConfirmButton, Loading, Notice, StatusBadge, fmtDate, useLoad } from "../components/ui.jsx";

export default function TaskDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: t, error, loading } = useLoad(() => api.getTask(id), [id]);
  const [err, setErr] = useState("");

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="page">
        <p><Link to="/tasks">← All tasks</Link></p>
        <Notice>{error.status === 404 ? "This task doesn't exist or isn't yours." : error.message}</Notice>
      </div>
    );
  }

  async function remove() {
    setErr("");
    try { await api.deleteTask(t.id); nav("/tasks", { replace: true }); }
    catch (e) { setErr(e.message); throw e; }
  }

  return (
    <div className="page">
      <p><Link to="/tasks">← All tasks</Link></p>
      <header className="page-head">
        <h1>{t.title || t.file_name}</h1>
        <StatusBadge status={t.status} />
      </header>
      <section className="panel">
        <p className="lead">{t.description}</p>
        <dl className="facts">
          <dt>Task ID</dt><dd>{t.id}</dd>
          <dt>Type</dt><dd>{t.task_type}</dd>
          <dt>Priority</dt><dd>{t.priority}</dd>
          <dt>File</dt><dd>{t.file_name}</dd>
          <dt>Created</dt><dd>{fmtDate(t.created_at)}</dd>
          <dt>Updated</dt><dd>{fmtDate(t.updated_at)}</dd>
        </dl>
        <div className="actions">
          {t.file_url && <a className="btn primary" href={t.file_url} target="_blank" rel="noreferrer">Open PDF</a>}
          <ConfirmButton label="Delete task" onConfirm={remove} />
        </div>
        <Notice>{err}</Notice>
        <p className="muted small">Deleting a task also removes its PDF from storage.</p>
      </section>
    </div>
  );
}
