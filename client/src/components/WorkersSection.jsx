import { useEffect, useState } from "react";
import { flowForgeApi } from "../api/flowForgeApi";

const WORKER_STATUSES = ["idle", "busy", "offline", "error"];

export default function WorkersSection() {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [lookupId, setLookupId] = useState("");
  const [name, setName] = useState("");
  const [workerType, setWorkerType] = useState("node");
  const [maxConcurrent, setMaxConcurrent] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadWorkers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await flowForgeApi.getAllWorkers();
      setWorkers(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await flowForgeApi.registerWorker({
        name: name.trim(),
        worker_type: workerType,
        max_concurrent_tasks: Number(maxConcurrent),
      });
      if (res.data) {
        setWorkers((prev) => [res.data, ...prev]);
      }
      setName("");
      setMaxConcurrent(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectWorker = async (id) => {
    if (!id) return;
    setError("");
    try {
      const res = await flowForgeApi.getWorkerById(id);
      setSelectedWorker(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setError("");
    try {
      const res = await flowForgeApi.updateWorkerStatus(id, newStatus);
      const updated = res.data;
      if (updated) {
        setWorkers((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        if (selectedWorker?.id === updated.id) setSelectedWorker(updated);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Register Worker (POST /workers/register) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 backdrop-blur-md">
        <h3 className="text-base font-semibold text-white">Register Worker</h3>
        <p className="mt-1 text-xs text-slate-400">
          Creates a worker record in PostgreSQL (defaults to idle status and 0 current tasks).
        </p>

        <form onSubmit={handleRegister} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-300">Worker Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Node Worker 1"
              className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Worker Type *</label>
            <select
              value={workerType}
              onChange={(e) => setWorkerType(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="node">node</option>
              <option value="python">python</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Max Concurrent</label>
            <input
              type="number"
              min={1}
              value={maxConcurrent}
              onChange={(e) => setMaxConcurrent(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            {error && (
              <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? "Registering..." : "Register Worker"}
            </button>
          </div>
        </form>
      </div>

      {/* All Workers (GET /workers/get-all) & Status Update (PATCH /workers/status/:id) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Workers Registry ({workers.length})</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Worker ID"
              className="w-24 rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleInspectWorker(lookupId)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/20"
            >
              Get By ID
            </button>
            <button
              type="button"
              onClick={loadWorkers}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/15"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-xs text-slate-400">Loading workers...</p>
        ) : workers.length === 0 ? (
          <p className="mt-4 text-xs text-slate-400">No workers registered yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="py-2.5 pr-3">ID</th>
                  <th className="py-2.5 pr-3">Name</th>
                  <th className="py-2.5 pr-3">Type</th>
                  <th className="py-2.5 pr-3">Tasks</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-white/5">
                    <td className="py-3 pr-3 font-mono text-slate-400">#{worker.id}</td>
                    <td className="py-3 pr-3 font-medium text-white">{worker.name}</td>
                    <td className="py-3 pr-3 uppercase">{worker.worker_type}</td>
                    <td className="py-3 pr-3">
                      {worker.current_tasks ?? 0} / {worker.max_concurrent_tasks}
                    </td>
                    <td className="py-3 pr-3">
                      <select
                        value={worker.status}
                        onChange={(e) => handleStatusChange(worker.id, e.target.value)}
                        className="rounded-md border border-white/15 bg-slate-950/90 px-2.5 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      >
                        {WORKER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleInspectWorker(worker.id)}
                        className="rounded-md bg-white/10 px-2.5 py-1 text-slate-200 hover:bg-white/20"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Worker Detail Card (GET /workers/by/:id) */}
      {selectedWorker && (
        <div className="rounded-2xl border border-indigo-400/40 bg-slate-900/90 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">
              Worker #{selectedWorker.id} — {selectedWorker.name}
            </h4>
            <button
              type="button"
              onClick={() => setSelectedWorker(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-slate-950/80 p-2.5">
              <span className="block text-slate-500">Runtime</span>
              <span className="font-medium uppercase text-white">{selectedWorker.worker_type}</span>
            </div>
            <div className="rounded-lg bg-slate-950/80 p-2.5">
              <span className="block text-slate-500">Status</span>
              <span className="font-medium text-white">{selectedWorker.status}</span>
            </div>
            <div className="rounded-lg bg-slate-950/80 p-2.5">
              <span className="block text-slate-500">Concurrency</span>
              <span className="font-medium text-white">
                {selectedWorker.current_tasks ?? 0} / {selectedWorker.max_concurrent_tasks}
              </span>
            </div>
            <div className="rounded-lg bg-slate-950/80 p-2.5">
              <span className="block text-slate-500">Last Heartbeat</span>
              <span className="font-medium text-white">
                {selectedWorker.last_heartbeat
                  ? new Date(selectedWorker.last_heartbeat).toLocaleString()
                  : "Null"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}