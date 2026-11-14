// All FlowForge backend calls live here. Cookies (accessToken / refreshToken) are
// HTTP-only, so every request uses credentials: "include".
const BASE = (import.meta.env.VITE_API_BASE || "/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let onSessionExpired = () => {};
export const setSessionExpiredHandler = (fn) => (onSessionExpired = fn);

async function raw(path, { method = "GET", json, form, headers = {} } = {}) {
  const init = { method, credentials: "include", headers: { ...headers } };
  if (json !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(json);
  }
  if (form) init.body = form; // never set Content-Type for FormData: the browser adds the boundary
  let res;
  try {
    res = await fetch(BASE + path, init);
  } catch {
    throw new ApiError("Can't reach the FlowForge server. Check that the backend is running.", 0);
  }
  const text = await res.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = { message: text.slice(0, 200) }; }
  }
  return { res, body };
}

let refreshing = null;
function refreshSession() {
  if (!refreshing) {
    refreshing = raw("/users/refresh-token", { method: "POST" })
      .then(({ res }) => res.ok)
      .catch(() => false)
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

// On a 401, try the refresh-token endpoint once and retry the original request.
async function request(path, opts = {}) {
  let { res, body } = await raw(path, opts);
  if (res.status === 401 && !opts.noRefresh) {
    if (await refreshSession()) ({ res, body } = await raw(path, opts));
    else onSessionExpired();
  }
  if (!res.ok) throw new ApiError(body?.message || `Request failed (${res.status})`, res.status, body);
  return body;
}

export function apiRequest(path, { method = "GET", body, headers = {} } = {}) {
  const isFormData = body instanceof FormData;
  const noRefresh = ["/users/login", "/users/register", "/users/refresh-token"].includes(path);

  return request(path, {
    method,
    headers,
    noRefresh,
    ...(isFormData ? { form: body } : body !== undefined ? { json: body } : {}),
  });
}

const data = (body) => body?.data ?? body;
export const asList = (d) => (Array.isArray(d) ? d : d?.tasks ?? d?.workers ?? []);

export const api = {
  // Health (public). Returns the body even on 503 so the UI can show which service is down.
  async health() {
    const { res, body } = await raw("/health");
    return { ok: res.ok, services: body?.services || {}, message: body?.message };
  },

  // Users & authentication
  register: (email, password) =>
    request("/users/register", { method: "POST", json: { email, password }, noRefresh: true }).then(data),
  login: (email, password) =>
    request("/users/login", { method: "POST", json: { email, password }, noRefresh: true }).then(data),
  logout: () => request("/users/logout", { method: "POST" }),
  refresh: async () => {
    const { res, body } = await raw("/users/refresh-token", { method: "POST" });
    if (!res.ok) throw new ApiError(body?.message || "Session could not be refreshed", res.status, body);
  },
  me: () => request("/users/me").then(data).then((d) => d?.user ?? d),
  profile: (username) => request(`/users/profile/${encodeURIComponent(username)}`).then(data),
  setupAccount(fullname, avatar) {
    const form = new FormData();
    form.append("fullname", fullname);
    form.append("avatar", avatar);
    return request("/users/setup-account", { method: "POST", form }).then(data);
  },

  // Tasks
  createTask(description, file) {
    const form = new FormData();
    form.append("description", description);
    form.append("file", file); // field name must be exactly "file"
    return request("/tasks", { method: "POST", form }).then(data);
  },
  listTasks: () => request("/tasks/get-all-task").then(data).then(asList),
  getTask: (id) => request(`/tasks/taskBy/${encodeURIComponent(id)}`).then(data),
  deleteTask: (id) => request(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" }),

  // Workers
  registerWorker: (payload) => request("/workers/register", { method: "POST", json: payload }).then(data),
  listWorkers: () => request("/workers/get-all").then(data).then(asList),
  getWorker: (id) => request(`/workers/by/${encodeURIComponent(id)}`).then(data),
  setWorkerStatus: (id, status) =>
    request(`/workers/status/${encodeURIComponent(id)}`, { method: "PATCH", json: { status } }).then(data),
};
