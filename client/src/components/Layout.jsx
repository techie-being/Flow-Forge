import { NavLink, Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth, displayName } from "../auth/AuthContext.jsx";
import HealthPill from "./HealthPill.jsx";
import { Loading } from "./ui.jsx";
import background from "../assets/background2.png";
import logo from "../assets/logo.png";

export function Brand() {
  return (
    <Link to="/dashboard" className="brand">
      <img src={logo} alt="" className="brand-logo" />
      <span>FlowForge</span>
    </Link>
  );
}

export function Layout() {
  const { user } = useAuth();
  return (
    <div className="shell">
      <aside className="side">
        <Brand />
        {user && <p className="nav-label">WORKSPACE</p>}
        <nav>
          {user ? (
            <>
              <NavLink to="/dashboard">Overview</NavLink>
              <NavLink to="/tasks">Tasks</NavLink>
              <NavLink to="/workers">Workers</NavLink>
              <NavLink to="/account">Account</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/register">Create account</NavLink>
            </>
          )}
        </nav>
        <div className="side-foot">
          <HealthPill />
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-actions">
            {user ? (
              <>
                <Link className="btn primary" to="/tasks#new-task">+ New task</Link>
                <Link className="topbar-avatar" to="/account" aria-label="Open account">
                  {displayName(user).slice(0, 1).toUpperCase()}
                </Link>
              </>
            ) : (
              <Link className="btn primary" to="/login">Sign in</Link>
            )}
          </div>
        </header>
        <div className="main-content"><Outlet /></div>
      </main>
    </div>
  );
}

export function Protected() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading text="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}

export function AuthFrame({ title, sub, children }) {
  return (
    <div className="auth-screen">
      <div className="auth-background ff-bg-zoom" style={{ backgroundImage: `url(${background})` }} />
      <div className="auth-overlay" />
      <section className="auth-card ff-rise">
        <div className="auth-card-brand">
          <img src={logo} alt="" />
          <span>FlowForge</span>
        </div>
        <h1>{title}</h1>
        {sub && <p className="auth-sub">{sub}</p>}
        {children}
      </section>
    </div>
  );
}
