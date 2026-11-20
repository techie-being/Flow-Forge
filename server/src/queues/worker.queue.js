
import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

const workerQueues = new Map();

const getWorkerQueue = (workerId) => {
    const queueName = `worker-${workerId}-queue`;

    // Reuse an existing queue instance
    if (workerQueues.has(queueName)) {
        return workerQueues.get(queueName);
    }

    const queue = new Queue(queueName, {
        connection: redisConnection,
    });

    workerQueues.set(queueName, queue);

    return queue;
};

// Add a task to the selected worker's queue
const addJobToWorker = async (workerId, taskId) => {
    const queue = getWorkerQueue(workerId);

    return await queue.add(
        "process-task",
        { taskId },
        {
            jobId: `task-${taskId}`,
        }
    );
};

// Close all worker queues
const closeWorkerQueues = async () => {
    for (const queue of workerQueues.values()) {
        await queue.close();
    }

    workerQueues.clear();
};

export {
    getWorkerQueue,
    addJobToWorker,
    closeWorkerQueues,
};
