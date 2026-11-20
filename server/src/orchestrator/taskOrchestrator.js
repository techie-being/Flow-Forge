
import { Worker } from "bullmq";
import { pool } from "../db/db.js";
import workerRedis from "../config/workerRedis.js";

import classifyTask from "./taskClassifier.js";
import {
    reserveAvailableWorker,
    releaseWorker,
} from "./workerSelector.js";

import { addJobToWorker } from "../queues/worker.queue.js";

const taskOrchestrator = new Worker(
    "task-queue",
    async (job) => {
        const { taskId } = job.data;

        console.log(`Orchestrator received task: ${taskId}`);

        const taskResult = await pool.query(
            `SELECT id, description
             FROM tasks
             WHERE id = $1`,
            [taskId]
        );

        const task = taskResult.rows[0];

        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        // Classify task
        const { taskType, priority } = classifyTask(
            task.description
        );

        // Save classification
        await pool.query(
            `UPDATE tasks
             SET task_type = $1,
                 priority = $2
             WHERE id = $3`,
            [taskType, priority, taskId]
        );

        console.log(
            `Task ${taskId} classified: ${taskType}, ${priority}`
        );

        // Reserve an available worker
        const worker = await reserveAvailableWorker();

        if (!worker) {
            throw new Error("No available workers");
        }

        try {
            // Dispatch task to the selected worker
            const workerJob = await addJobToWorker(
                worker.id,
                taskId
            );

            console.log(
                `Task ${taskId} dispatched to ${worker.name}`
            );

            return {
                taskId,
                workerId: worker.id,
                workerJobId: workerJob.id,
                taskType,
                priority,
            };
        } catch (error) {
            await releaseWorker(worker.id);
            throw error;
        }
    },
    {
        connection: workerRedis,
    }
);

taskOrchestrator.on("completed", (job) => {
    console.log(`Orchestrator completed job: ${job.id}`);
});

taskOrchestrator.on("failed", (job, error) => {
    console.error(
        `Orchestrator failed job ${job?.id}:`,
        error.message
    );
});

taskOrchestrator.on("error", (error) => {
    console.error("Orchestrator error:", error.message);
});

console.log("Task orchestrator listening on task-queue");

export default taskOrchestrator;
