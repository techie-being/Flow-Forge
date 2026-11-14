import { Navigate, Route, Routes } from "react-router-dom";
import { Layout, Protected } from "./components/Layout.jsx";
import Account from "./pages/Account.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";
import TaskDetail from "./pages/TaskDetail.jsx";
import Tasks from "./pages/Tasks.jsx";
import WorkerDetail from "./pages/WorkerDetail.jsx";
import Workers from "./pages/Workers.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/u/:username" element={<Profile />} />
        <Route element={<Protected />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="workers" element={<Workers />} />
          <Route path="workers/:id" element={<WorkerDetail />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
