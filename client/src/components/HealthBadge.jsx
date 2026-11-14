import { useEffect, useState } from "react";
import { flowForgeApi } from "../api/flowForgeApi";

export default function HealthBadge() {
  const [health, setHealth] = useState({ status: "checking", api: "...", database: "..." });

  const pingHealth = async () => {
    try {
      const res = await flowForgeApi.checkHealth();
      setHealth({
        status: res.success ? "healthy" : "unhealthy",
        api: res.services?.api || "up",
        database: res.services?.database || "up",
      });
    } catch (err) {
      const services = err.payload?.services;
      setHealth({
        status: "unhealthy",
        api: services?.api || "down",
        database: services?.database || "down",
      });
    }
  };

  useEffect(() => {
    pingHealth();
  }, []);

  const isHealthy = health.status === "healthy";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/75 px-3.5 py-2 text-xs backdrop-blur-md">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          health.status === "checking"
            ? "animate-pulse bg-amber-400"
            : isHealthy
            ? "bg-emerald-400"
            : "bg-rose-500"
        }`}
      />
      <span className="text-slate-300">
        API: <strong className="uppercase text-white">{health.api}</strong>
      </span>
      <span className="text-slate-600">|</span>
      <span className="text-slate-300">
        DB: <strong className="uppercase text-white">{health.database}</strong>
      </span>
      <button
        type="button"
        onClick={pingHealth}
        className="ml-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-slate-200 hover:bg-white/20"
      >
        Ping
      </button>
    </div>
  );
}