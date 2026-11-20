
import taskQueue from "../queues/task.queue.js";

const addTaskJob = async (taskId) => {
    return await taskQueue.add(
        "process-task",
        { taskId },
        {
            jobId: `task-${taskId}`,
            attempts: 5,
            backoff: {
                type: "exponential",
                delay: 5000,
            },
        }
    );
};

export default addTaskJob;
