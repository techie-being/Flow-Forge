
import taskOrchestrator from "./taskOrchestrator.js";
import workerRedis from "../config/workerRedis.js";
import { pool } from "../db/db.js";

let shuttingDown = false;

const shutdown = async () => {
    if (shuttingDown) return;

    shuttingDown = true;
    console.log("Shutting down task orchestrator...");

    try {
        await taskOrchestrator.close();
        await workerRedis.quit();
        await pool.end();

        console.log("Task orchestrator stopped successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Orchestrator shutdown error:", error.message);
        process.exit(1);
    }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Orchestrator process started.");
