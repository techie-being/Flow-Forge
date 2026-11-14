import { useEffect, useState } from "react";
import { api } from "../api/api.js";

export default function HealthPill() {
  const [h, setH] = useState(null); // null = checking, false = unreachable

  const check = () => api.health().then(setH).catch(() => setH(false));
  useEffect(() => {
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, []);

  const state = h === null ? "checking" : h === false ? "down" : h.ok ? "up" : "degraded";
  const label = { checking: "Checking server…", up: "All systems up", degraded: "Server degraded", down: "Server unreachable" }[state];
  return (
    <button className="health" data-state={state} onClick={check} title="Check again">
      <span className="dot" />
      <span>
        {label}
        {h && h.services && (
          <small>API {h.services.api || "?"} · Database {h.services.database || "?"}</small>
        )}
      </span>
    </button>
  );
}
