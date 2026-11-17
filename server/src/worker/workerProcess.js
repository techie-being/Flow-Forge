
import startWorker from "./workerRuntime.js";
import workerRedis from "../config/workerRedis.js";
import { pool } from "../db/db.js";

import {
    markWorkerOnline,
    updateWorkerHeartbeat,
    markWorkerOffline,
} from "../services/workerStatus.service.js";

const workerId = process.env.WORKER_ID;
const workerDbId = Number(process.env.WORKER_DB_ID);
const queueName = process.env.WORKER_QUEUE;

if (!workerId || !workerDbId || !queueName) {
    throw new Error("WORKER_ID, WORKER_DB_ID and WORKER_QUEUE are required");
}

let worker;
let heartbeatInterval;
let isShuttingDown = false;

// Start worker process
const start = async () => {
    try {
        // 1. Mark worker as available
        await markWorkerOnline(workerDbId);

        // 2. Start BullMQ worker
        worker = startWorker(workerId, workerDbId, queueName);

        // 3. Send heartbeat every 10 seconds
        heartbeatInterval = setInterval(async () => {
            try {
                await updateWorkerHeartbeat(workerDbId);
            } catch (error) {
                console.error(
                    `${workerId} heartbeat error:`,
                    error.message
                );
            }
        }, 10000);

    } catch (error) {
        console.error(`${workerId} startup error:`, error.message);
        process.exit(1);
    }
};

// Graceful shutdown
const shutdown = async () => {
    if (isShuttingDown) return;

    isShuttingDown = true;

    console.log(`Shutting down Worker ${workerId}...`);

    clearInterval(heartbeatInterval);

    try {
        if (worker) {
            await worker.close();
        }

        await markWorkerOffline(workerDbId);

        console.log(`${workerId} marked offline.`);

        await workerRedis.quit();
        await pool.end();

        process.exit(0);

    } catch (error) {
        console.error(`${workerId} shutdown error:`, error.message);
        process.exit(1);
    }
};

// Parent manager handles Ctrl+C and sends SIGTERM to children
// Receive graceful shutdown request from workerManager
process.on("message", (message) => {
    if (message?.type === "shutdown") {
        shutdown();
    }
});

process.on("SIGINT", () => {});
process.on("SIGTERM", shutdown);

start();