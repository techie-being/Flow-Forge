import { apiRequest } from "./httpClient";

const register = (email, password) =>
  apiRequest("/users/register", {
    method: "POST",
    body: { email, password },
  });

const login = (email, password) =>
  apiRequest("/users/login", {
    method: "POST",
    body: { email, password },
  });

const logout = () =>
  apiRequest("/users/logout", {
    method: "POST",
  });

export const flowForgeApi = {
  // ==========================================
  // 1. HEALTH API (Guide 1)
  // ==========================================
  checkHealth: () => apiRequest("/health", { method: "GET" }),

  // ==========================================
  // 2. USERS & AUTH APIs (Guide 1)
  // ==========================================
  register,
  registerUser: register,

  login,
  loginUser: (email, password) =>
    login(email, password).then((response) => ({
      ...response,
      data: response.data?.user ?? response.data,
    })),

  logout,
  logoutUser: logout,

  refreshToken: () =>
    apiRequest("/users/refresh-token", {
      method: "POST",
    }),

  getCurrentUser: () =>
    apiRequest("/users/me", {
      method: "GET",
    }),

  getUserProfile: (username) =>
    apiRequest(`/users/profile/${encodeURIComponent(username)}`, {
      method: "GET",
    }),

  // ==========================================
  // 3. TASK MANAGEMENT APIs (Guide 2)
  // ==========================================
  createTask: (description, pdfFile) => {
    const formData = new FormData();
    formData.append("description", description);
    formData.append("file", pdfFile);
    return apiRequest("/tasks", {
      method: "POST",
      body: formData,
    });
  },

  getAllTasks: () =>
    apiRequest("/tasks/get-all-task", {
      method: "GET",
    }),

  getTaskById: (id) =>
    apiRequest(`/tasks/taskBy/${encodeURIComponent(id)}`, {
      method: "GET",
    }),

  deleteTask: (id) =>
    apiRequest(`/tasks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  // ==========================================
  // 4. WORKER MANAGEMENT APIs (Guide 3)
  // ==========================================
  registerWorker: ({ name, worker_type, max_concurrent_tasks }) =>
    apiRequest("/workers/register", {
      method: "POST",
      body: {
        name,
        worker_type,
        ...(max_concurrent_tasks ? { max_concurrent_tasks: Number(max_concurrent_tasks) } : {}),
      },
    }),

  getAllWorkers: () =>
    apiRequest("/workers/get-all", {
      method: "GET",
    }),

  getWorkerById: (id) =>
    apiRequest(`/workers/by/${encodeURIComponent(id)}`, {
      method: "GET",
    }),

  updateWorkerStatus: (id, status) =>
    apiRequest(`/workers/status/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status },
    }),
};