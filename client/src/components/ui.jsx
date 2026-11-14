import { useCallback, useEffect, useState } from "react";

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? String(iso) : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// Loads data once, exposes reload(silent) and setData for local updates.
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const run = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ data: silent ? s.data : null, error: silent ? s.error : error, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  const setData = (d) => setState((s) => ({ ...s, data: typeof d === "function" ? d(s.data) : d }));
  return { ...state, reload: run, setData };
}

export function Notice({ kind = "error", children }) {
  if (!children) return null;
  return <div className={`notice ${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}

export function Loading({ text = "Loading…" }) {
  return <p className="muted loading">{text}</p>;
}

export function StatusBadge({ status }) {
  return <span className="badge" data-status={status || "unknown"}>{status || "unknown"}</span>;
}

// Two-step delete: first click arms it, second click confirms.
export function ConfirmButton({ label = "Delete", busyLabel = "Deleting…", onConfirm }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  async function go() {
    setBusy(true);
    try { await onConfirm(); } catch { /* the caller shows the error */ }
    setBusy(false);
    setArmed(false);
  }
  if (busy) return <button className="btn danger" disabled>{busyLabel}</button>;
  if (!armed) return <button className="btn ghost danger-text" onClick={() => setArmed(true)}>{label}</button>;
  return <button className="btn danger" onClick={go}>Confirm {label.toLowerCase()}</button>;
}

// One slot per concurrent task the worker can take; filled slots are in use.
export function LoadMeter({ current = 0, max = 1 }) {
  const small = max <= 12;
  return (
    <div className="meter" role="img" aria-label={`${current} of ${max} task slots in use`}>
      {small ? (
        <span className="slots">
          {Array.from({ length: max }, (_, i) => <span key={i} className={i < current ? "slot on" : "slot"} />)}
        </span>
      ) : (
        <span className="bar"><span style={{ width: `${Math.min(100, (current / max) * 100)}%` }} /></span>
      )}
      <small>{current} of {max} tasks</small>
    </div>
  );
}
