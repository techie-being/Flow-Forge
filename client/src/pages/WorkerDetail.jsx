import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/api.js";
import { LoadMeter, Loading, Notice, StatusBadge, fmtDate, useLoad } from "../components/ui.jsx";
import { StatusSelect } from "./Workers.jsx";

export default function WorkerDetail() {
  const { id } = useParams();
  const { data: w, error, loading, setData } = useLoad(() => api.getWorker(id), [id]);
  const [err, setErr] = useState("");

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="page">
        <p><Link to="/workers">← All workers</Link></p>
        <Notice>{error.status === 404 ? "No worker with this ID." : error.message}</Notice>
      </div>
    );
  }

  return (
    <div className="page">
      <p><Link to="/workers">← All workers</Link></p>
      <header className="page-head">
        <h1>{w.name}</h1>
        <StatusBadge status={w.status} />
      </header>
      <section className="panel">
        <LoadMeter current={w.current_tasks} max={w.max_concurrent_tasks} />
        <dl className="facts">
          <dt>Worker ID</dt><dd>{w.id}</dd>
          <dt>Runtime</dt><dd>{w.worker_type}</dd>
          <dt>Max concurrent tasks</dt><dd>{w.max_concurrent_tasks}</dd>
          <dt>Running now</dt><dd>{w.current_tasks}</dd>
          <dt>Last heartbeat</dt><dd>{w.last_heartbeat ? fmtDate(w.last_heartbeat) : "None yet"}</dd>
          <dt>Registered</dt><dd>{fmtDate(w.created_at)}</dd>
          <dt>Status</dt>
          <dd><StatusSelect worker={w} onChange={(x) => { setErr(""); setData(x); }} onError={setErr} /></dd>
        </dl>
        <Notice>{err}</Notice>
        <p className="muted small">Status is set by hand for now. Heartbeat monitoring will take over later.</p>
      </section>
    </div>
  );
}
