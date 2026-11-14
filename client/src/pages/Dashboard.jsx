import { useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api.js";
import { LoadMeter, Loading, Notice, StatusBadge, fmtDate, useLoad } from "../components/ui.jsx";

const QUEUED = new Set(["pending", "queued"]);
const RUNNING = new Set(["processing", "running", "in_progress"]);
const COMPLETED = new Set(["completed", "done"]);

function normalizedStatus(value) {
  return String(value || "").toLowerCase();
}

function countStatus(tasks, statuses) {
  return tasks.filter((task) => statuses.has(normalizedStatus(task.status))).length;
}

function Metric({ label, value, detail, accent }) {
  return (
    <article className={`metric-card ${accent || ""}`}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
    </article>
  );
}

function getTaskTitle(task) {
  return task.title || task.file_name || `Task ${task.id}`;
}

export default function Dashboard() {
  const taskState = useLoad(() => api.listTasks(), []);
  const workerState = useLoad(() => api.listWorkers(), []);
  const tasks = taskState.data || [];
  const workers = workerState.data || [];
  const queued = countStatus(tasks, QUEUED);
  const running = countStatus(tasks, RUNNING);
  const completed = countStatus(tasks, COMPLETED);
  const onlineWorkers = workers.filter((worker) => ["idle", "busy"].includes(normalizedStatus(worker.status))).length;
  const groups = [
    { label: "Queued", count: queued, status: "pending" },
    { label: "Running", count: running, status: "running" },
    { label: "Completed", count: completed, status: "completed" },
    { label: "Failed", count: countStatus(tasks, new Set(["failed", "error"])), status: "failed" },
  ];
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) {
        taskState.reload(true);
        workerState.reload(true);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [taskState.reload, workerState.reload]);

  const metricValue = (state, value) => (state.loading ? "…" : state.error ? "—" : value);

  return (
    <div className="page dashboard">
      <header className="page-head dashboard-head">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="muted">A live view of your tasks and workers.</p>
        </div>
      </header>

      {taskState.error && (
        <Notice>
          We couldn't load your task data.{" "}
          <button className="link" onClick={() => taskState.reload()}>Try again</button>
        </Notice>
      )}
      {workerState.error && (
        <Notice>
          We couldn't load your worker data.{" "}
          <button className="link" onClick={() => workerState.reload()}>Try again</button>
        </Notice>
      )}

      <section className="metric-grid" aria-label="FlowForge overview">
        <Metric label="Total tasks" value={metricValue(taskState, tasks.length)} detail="All submitted work" />
        <Metric label="Queued" value={metricValue(taskState, queued)} detail="Waiting for a worker" accent="metric-queued" />
        <Metric label="Completed" value={metricValue(taskState, completed)} detail="Successfully processed" accent="metric-completed" />
        <Metric label="Workers online" value={metricValue(workerState, onlineWorkers)} detail={`${workers.length} registered`} accent="metric-workers" />
      </section>

      <div className="dashboard-grid">
        <section className="panel dashboard-panel">
          <header className="section-head">
            <div>
              <h2>Task activity</h2>
              <p className="muted small">Current status distribution</p>
            </div>
            <Link to="/tasks">View tasks <span aria-hidden="true">→</span></Link>
          </header>
          {taskState.error ? <p className="empty">Task activity is unavailable.</p> : taskState.loading && !taskState.data ? <Loading /> : tasks.length ? (
            <div className="activity-list">
              {groups.map((group) => {
                const share = tasks.length ? (group.count / tasks.length) * 100 : 0;
                return (
                  <div className="activity-item" key={group.label}>
                    <div className="activity-label">
                      <span className={`activity-dot ${group.status}`} />
                      <span>{group.label}</span>
                      <strong>{group.count}</strong>
                    </div>
                    <div className="activity-track" aria-label={`${group.label}: ${group.count} tasks`}>
                      <span className={group.status} style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty">Task activity will appear here after you submit your first PDF.</p>
          )}
        </section>

        <section className="panel dashboard-panel">
          <header className="section-head">
            <div>
              <h2>Workers</h2>
              <p className="muted small">Capacity at a glance</p>
            </div>
            <Link to="/workers">View all <span aria-hidden="true">→</span></Link>
          </header>
          {workerState.error ? <p className="empty">Worker data is unavailable.</p> : workerState.loading && !workerState.data ? <Loading /> : workers.length ? (
            <div className="worker-list">
              {workers.slice(0, 4).map((worker) => (
                <Link className="worker-summary" to={`/workers/${worker.id}`} key={worker.id}>
                  <span className={`worker-dot ${normalizedStatus(worker.status)}`} />
                  <span className="worker-name">{worker.name}</span>
                  <StatusBadge status={worker.status} />
                  <span className="worker-load">
                    <LoadMeter current={worker.current_tasks} max={worker.max_concurrent_tasks} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty">Register a worker to start processing queued tasks.</p>
          )}
        </section>
      </div>

      <section className="panel dashboard-panel">
        <header className="section-head">
          <div>
            <h2>Recent tasks</h2>
            <p className="muted small">Latest work submitted to FlowForge</p>
          </div>
          <Link to="/tasks">View all tasks <span aria-hidden="true">→</span></Link>
        </header>
        {taskState.error ? <p className="empty">Recent tasks are unavailable.</p> : taskState.loading && !taskState.data ? <Loading /> : recentTasks.length ? (
          <ul className="dashboard-task-list">
            {recentTasks.map((task) => (
              <li className="dashboard-task" key={task.id}>
                <div className="dashboard-task-main">
                  <Link to={`/tasks/${task.id}`} className="row-title">{getTaskTitle(task)}</Link>
                  <p>{task.description || task.task_type || "PDF task"}</p>
                  <small className="muted">Created {fmtDate(task.created_at)}</small>
                </div>
                <StatusBadge status={task.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">No tasks yet. Create a task to see it here.</p>
        )}
      </section>
    </div>
  );
}
