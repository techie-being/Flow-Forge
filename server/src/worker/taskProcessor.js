
const processTask = async (task) => {
    console.log(`Processing task: ${task.id}`);

    return {
        message: "Task processed successfully",
        taskId: task.id,
        taskType: task.task_type
    };
};

export default processTask;