import taskQueue from "../queues/task.queue.js";

const addTaskJob = async (taskId) => {
    return await taskQueue.add(
        "process-task",
        { taskId },
        {
            jobId: `task-${taskId}`,
        }
    );
};

export default addTaskJob;