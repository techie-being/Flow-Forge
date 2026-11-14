import { useEffect, useRef, useState } from "react";
import { flowForgeApi } from "../api/flowForgeApi";

const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB

export default function TasksSection({ isAuthenticated }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [lookupId, setLookupId] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const loadTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await flowForgeApi.getAllTasks();
      setTasks(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    } else {
      setTasks([]);
      setSelectedTask(null);
    }
  }, [isAuthenticated]);

  const handleFileChange = (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) {
      setPdfFile(null);
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      e.target.value = "";
      setPdfFile(null);
      return;
    }
    if (file.size > MAX_PDF_SIZE) {
      setError("Maximum allowed PDF size is 5 MB.");
      e.target.value = "";
      setPdfFile(null);
      return;
    }
    setPdfFile(file);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError("");
    if (!description.trim() || !pdfFile) {
      setError("Task description and a PDF file are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await flowForgeApi.createTask(description.trim(), pdfFile);
      if (res.data) {
        setTasks((prev) => [res.data, ...prev]);
      }
      setDescription("");
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectTask = async (id) => {
    if (!id) return;
    setError("");
    try {
      const res = await flowForgeApi.getTaskById(id);
      setSelectedTask(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    setError("");
    try {
      await flowForgeApi.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTask?.id === id) setSelectedTask(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200 backdrop-blur-md">
        Sign in above to create, view, inspect, and delete tasks.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Task (POST /tasks) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 backdrop-blur-md">
        <h3 className="text-base font-semibold text-white">Create Task (PDF Upload)</h3>
        <p className="mt-1 text-xs text-slate-400">
          Title is derived from the PDF filename. Task type, status, and priority are set automatically.
        </p>

        <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Description / Instructions *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Extract the key requirements from this PDF..."
              className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              PDF File (Max 5 MB) *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              required
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "Uploading PDF..." : "Create Task"}
          </button>
        </form>
      </div>

      {/* All Tasks (GET /tasks/get-all-task) & Lookup By ID (GET /tasks/taskBy/:id) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">My Tasks ({tasks.length})</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Task ID"
              className="w-24 rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleInspectTask(lookupId)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/20"
            >
              Get By ID
            </button>
            <button
              type="button"
              onClick={loadTasks}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/15"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-xs text-slate-400">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="mt-4 text-xs text-slate-400">No tasks found for your account.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="py-2.5 pr-3">ID</th>
                  <th className="py-2.5 pr-3">Title</th>
                  <th className="py-2.5 pr-3">Type</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 pr-3">Priority</th>
                  <th className="py-2.5 pr-3">PDF</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-white/5">
                    <td className="py-3 pr-3 font-mono text-slate-400">#{task.id}</td>
                    <td className="py-3 pr-3 font-medium text-white">{task.title}</td>
                    <td className="py-3 pr-3">{task.task_type}</td>
                    <td className="py-3 pr-3">
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 capitalize">{task.priority}</td>
                    <td className="py-3 pr-3">
                      {task.file_url ? (
                        <a
                          href={task.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 underline hover:text-indigo-300"
                        >
                          {task.file_name || "Open PDF"}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleInspectTask(task.id)}
                        className="rounded-md bg-white/10 px-2.5 py-1 text-slate-200 hover:bg-white/20"
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="rounded-md bg-rose-600/20 px-2.5 py-1 text-rose-300 hover:bg-rose-600/40"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Task Detail Card */}
      {selectedTask && (
        <div className="rounded-2xl border border-indigo-400/40 bg-slate-900/90 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">
              Task #{selectedTask.id} — {selectedTask.title}
            </h4>
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-300">{selectedTask.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-slate-950/80 p-2.5">
              <span className="block text-slate-500">Status</span>
              <span className="font-medium text-white">{selectedTask.status}</span>
            </div>
            <div className="rounded-lg bg-slate-950/80 p-2.5">
              <span className="block text-slate-500">Priority</span>
              <span className="font-medium text-white">{selectedTask.priority}</span>
            </div>
            <div className="rounded-lg bg-slate-950/80 p-2.5">
              <span className="block text-slate-500">Type</span>
              <span className="font-medium text-white">{selectedTask.task_type}</span>
            </div>
            <div className="rounded-lg bg-slate-950/80 p-2.5">
              <span className="block text-slate-500">Created</span>
              <span className="font-medium text-white">
                {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleString() : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}