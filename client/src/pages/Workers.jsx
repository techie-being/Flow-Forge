import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api.js";
import { LoadMeter, Loading, Notice, StatusBadge, fmtDate, useLoad } from "../components/ui.jsx";

export const WORKER_STATUSES = ["idle", "busy", "offline", "error"];

function RegisterWorker({ onCreated }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("node");
  const [max, setMax] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Give the worker a name.");
    const payload = { name: name.trim(), worker_type: type };
    if (max !== "") {
      const n = Number(max);
      if (!Number.isInteger(n) || n < 1) return setError("Max concurrent tasks must be a whole number of 1 or more.");
      payload.max_concurrent_tasks = n;
    }
    setBusy(true);
    try {
      onCreated(await api.registerWorker(payload));
      setName(""); setMax("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <h2>Register a worker</h2>
      <div className="grid3">
        <label>Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Node Worker 1" />
        </label>
        <label>Runtime
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="node">node</option>
            <option value="python">python</option>
          </select>
        </label>
        <label>Max concurrent tasks
          <input type="number" min={1} step={1} value={max} onChange={(e) => setMax(e.target.value)} placeholder="1" />
        </label>
      </div>
      <Notice>{error}</Notice>
      <div><button className="btn primary" disabled={busy}>{busy ? "Registering…" : "Register worker"}</button></div>
      <p className="muted small">This adds a record only. It doesn't start a worker process or run tasks.</p>
    </form>
  );
}

export function StatusSelect({ worker, onChange, onError }) {
  const [busy, setBusy] = useState(false);
  async function change(e) {
    const next = e.target.value;
    setBusy(true);
    try { onChange(await api.setWorkerStatus(worker.id, next)); }
    catch (err) { onError(err.message); }
    finally { setBusy(false); }
  }
  return (
    <select className="status-select" aria-label={`Status of ${worker.name}`} value={worker.status} onChange={change} disabled={busy}>
      {WORKER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

export default function Workers() {
  const { data: workers, error, loading, reload, setData } = useLoad(() => api.listWorkers(), []);
  const [flash, setFlash] = useState("");
  const [actionError, setActionError] = useState("");

  const replace = (w) => { setActionError(""); setData((l) => (l || []).map((x) => (x.id === w.id ? w : x))); };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Workers</h1>
        <button className="btn" onClick={() => reload()}>Refresh</button>
      </header>
      <RegisterWorker onCreated={(w) => { setData((l) => [w, ...(l || [])]); setFlash(`Registered ${w.name}`); }} />
      <Notice kind="ok">{flash}</Notice>
      <Notice>{actionError}</Notice>

      {loading && !workers ? <Loading /> : error ? (
        <Notice>{error.message} <button className="link" onClick={() => reload()}>Try again</button></Notice>
      ) : workers.length === 0 ? (
        <p className="empty">No workers registered. Add one above so tasks have somewhere to run.</p>
      ) : (
        <ul className="rows">
          {workers.map((w) => (
            <li key={w.id} className="row" data-status={w.status}>
              <div className="row-main">
                <Link to={`/workers/${w.id}`} className="row-title">{w.name}</Link>
                <p><span className="tag">{w.worker_type}</span> <LoadMeter current={w.current_tasks} max={w.max_concurrent_tasks} /></p>
                <small className="muted">
                  {w.last_heartbeat ? `Last heartbeat ${fmtDate(w.last_heartbeat)}` : "No heartbeat yet"} · Registered {fmtDate(w.created_at)}
                </small>
              </div>
              <div className="row-side">
                <StatusBadge status={w.status} />
                <StatusSelect worker={w} onChange={replace} onError={setActionError} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
