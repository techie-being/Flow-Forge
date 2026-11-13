
import startWorker from "./workerRuntime.js";
import workerRedis from "../config/workerRedis.js";

const workerId = process.env.WORKER_ID;
const queueName = process.env.WORKER_QUEUE;

if (!workerId || !queueName) {
    throw new Error("WORKER_ID and WORKER_QUEUE are required");
}

const worker = startWorker(workerId, queueName);

const shutdown = async () => {
    console.log(`Shutting down Worker ${workerId}...`);

    await worker.close();
    await workerRedis.quit();

    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
