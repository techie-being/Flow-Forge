import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api.js";
import { ConfirmButton, Loading, Notice, StatusBadge, fmtDate, useLoad } from "../components/ui.jsx";

const MAX_BYTES = 5 * 1024 * 1024;

function NewTask({ onCreated }) {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  function pick(e) {
    const f = e.target.files?.[0] || null;
    setError("");
    if (f && f.type !== "application/pdf") {
      setFile(null); input.current.value = "";
      return setError("Only PDF files are accepted.");
    }
    if (f && f.size > MAX_BYTES) {
      setFile(null); input.current.value = "";
      return setError("That file is over 5 MB. Choose a smaller PDF.");
    }
    setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!description.trim()) return setError("Describe what should be done with the PDF.");
    if (!file) return setError("Choose a PDF to upload.");
    setBusy(true);
    try {
      const task = await api.createTask(description.trim(), file);
      onCreated(task);
      setDescription(""); setFile(null); input.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form id="new-task" className="panel stack" onSubmit={submit}>
      <h2>New task</h2>
      <label>What should be done?
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Extract the key requirements" />
      </label>
      <label>PDF document
        <input ref={input} type="file" accept="application/pdf" onChange={pick} />
        <small className="muted">{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF only, up to 5 MB. The task title comes from the file name."}</small>
      </label>
      <Notice>{error}</Notice>
      <div><button className="btn primary" disabled={busy}>{busy ? "Uploading…" : "Create task"}</button></div>
    </form>
  );
}

export default function Tasks() {
  const { data: tasks, error, loading, reload, setData } = useLoad(() => api.listTasks(), []);
  const [filter, setFilter] = useState("all");
  const [flash, setFlash] = useState("");
  const [actionError, setActionError] = useState("");

  // statuses change as workers pick tasks up, so refresh quietly while the tab is visible
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) reload(true); }, 10000);
    return () => clearInterval(t);
  }, [reload]);

  async function remove(task) {
    setActionError("");
    try {
      await api.deleteTask(task.id);
      setData((list) => (list || []).filter((t) => t.id !== task.id));
      setFlash("Task deleted");
    } catch (err) {
      setActionError(err.message);
      throw err;
    }
  }

  const statuses = [...new Set((tasks || []).map((t) => t.status).filter(Boolean))];
  const shown = (tasks || []).filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Tasks</h1>
        <button className="btn" onClick={() => reload()}>Refresh</button>
      </header>

      <NewTask onCreated={(t) => { setData((l) => [t, ...(l || [])]); setFlash("Task created"); }} />
      <Notice kind="ok">{flash}</Notice>
      <Notice>{actionError}</Notice>

      {statuses.length > 0 && (
        <div className="chips" role="group" aria-label="Filter by status">
          {["all", ...statuses].map((s) => (
            <button key={s} className={filter === s ? "chip on" : "chip"} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      )}

      {loading && !tasks ? <Loading /> : error ? (
        <Notice>{error.message} <button className="link" onClick={() => reload()}>Try again</button></Notice>
      ) : shown.length === 0 ? (
        <p className="empty">{tasks?.length ? "No tasks with this status." : "No tasks yet. Upload a PDF above to create your first one."}</p>
      ) : (
        <ul className="rows">
          {shown.map((t) => (
            <li key={t.id} className="row" data-status={t.status}>
              <div className="row-main">
                <Link to={`/tasks/${t.id}`} className="row-title">{t.title || t.file_name || `Task ${t.id}`}</Link>
                <p>{t.description}</p>
                <small className="muted">Created {fmtDate(t.created_at)} · {t.task_type} · {t.priority} priority</small>
              </div>
              <div className="row-side">
                <StatusBadge status={t.status} />
                <div className="actions">
                  {t.file_url && <a className="btn ghost" href={t.file_url} target="_blank" rel="noreferrer">Open PDF</a>}
                  <ConfirmButton onConfirm={() => remove(t)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
