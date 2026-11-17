
import "dotenv/config";
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";

const workerEntry = fileURLToPath(
    new URL("./workerProcess.js", import.meta.url)
);

const workerConfigs = [
    {
        id: "worker-1",
        dbId: 1,
        queue: "worker-1-queue",
    },
    {
        id: "worker-2",
        dbId: 2,
        queue: "worker-2-queue",
    },
];

const workers = new Map();
const restartTimers = new Map();

let shuttingDown = false;

const RESTART_DELAY = 3000;

// Start an independent worker process
const startWorkerProcess = (config) => {
    if (shuttingDown) return;

    console.log(`Starting ${config.id}...`);

    const child = fork(workerEntry, [], {
        env: {
            ...process.env,
            WORKER_ID: config.id,
            WORKER_DB_ID: String(config.dbId),
            WORKER_QUEUE: config.queue,
        },
        stdio: "inherit",
    });

    workers.set(config.id, child);

    console.log(`Started ${config.id} | PID: ${child.pid}`);

    child.on("exit", (code, signal) => {
        console.log(
            `${config.id} exited | Code: ${code} | Signal: ${signal}`
        );

        // Ignore stale process events
        if (workers.get(config.id) !== child) return;

        workers.delete(config.id);

        // Do not restart during intentional shutdown
        if (shuttingDown) return;

        console.log(`${config.id} crashed or stopped unexpectedly.`);

        console.log(
            `Restarting ${config.id} in ${RESTART_DELAY / 1000} seconds...`
        );

        const timer = setTimeout(() => {
            restartTimers.delete(config.id);

            if (!shuttingDown) {
                startWorkerProcess(config);
            }
        }, RESTART_DELAY);

        restartTimers.set(config.id, timer);
    });

    child.on("error", (error) => {
        console.error(`${config.id} process error:`, error.message);
    });
};

// Start all configured workers
workerConfigs.forEach(startWorkerProcess);

// Graceful shutdown
const shutdown = async () => {
    if (shuttingDown) return;

    shuttingDown = true;

    console.log("Shutting down all workers...");

    // Cancel pending restarts
    for (const timer of restartTimers.values()) {
        clearTimeout(timer);
    }

    restartTimers.clear();

    // Send shutdown message to each worker
    const shutdownPromises = [...workers.values()].map((child) => {
        return new Promise((resolve) => {
            child.once("exit", resolve);

            if (child.connected) {
                child.send({ type: "shutdown" });
            } else {
                child.kill();
            }
        });
    });

    await Promise.all(shutdownPromises);

    workers.clear();

    console.log("All workers stopped.");
};

// Handle Ctrl+C and termination signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
