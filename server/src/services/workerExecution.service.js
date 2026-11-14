
import { pool } from "../db/db.js";

const createExecutionRecord = async (taskId, workerId) => {
    // Find the next attempt number for this task
    const attemptResult = await pool.query(
        `SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_attempt
         FROM task_executions
         WHERE task_id = $1`,
        [taskId]
    );

    const attemptNumber = attemptResult.rows[0].next_attempt;

    // Create execution record
    const result = await pool.query(
        `INSERT INTO task_executions
         (task_id, worker_id, attempt_number, status, started_at)
         VALUES ($1, $2, $3, 'running', CURRENT_TIMESTAMP)
         RETURNING *`,
        [taskId, workerId, attemptNumber]
    );

    return result.rows[0];
};


const completeExecution = async (executionId, resultData) => {
    const result = await pool.query(
        `UPDATE task_executions
         SET status = 'completed',
             result = $1,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [JSON.stringify(resultData), executionId]
    );

    return result.rows[0];
};

const failExecution = async (executionId, errorMessage) => {
    const result = await pool.query(
        `UPDATE task_executions
         SET status = 'failed',
             error_message = $1,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [errorMessage, executionId]
    );

    return result.rows[0];
};


const getTaskForExecution = async (taskId) => {
    const result = await pool.query(
        `SELECT *
         FROM tasks
         WHERE id = $1`,
        [taskId]
    );

    return result.rows[0] || null;
};


const executeTask = async ({ taskId, workerId, processor }) => {
    let execution;

    try {
        // 1. Create execution record
        execution = await createExecutionRecord(taskId, workerId);

        // 2. Retrieve task details
        const task = await getTaskForExecution(taskId);

        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        // 3. Execute the actual processing logic
        const taskResult = await processor(task);

        // 4. Save result and mark execution completed
        return await completeExecution(execution.id, taskResult);

    } catch (error) {
    if (execution) {
        try {
            await failExecution(execution.id, error.message);
        } catch (updateError) {
            console.error(
                "Failed to update execution status:",
                updateError.message
            );
        }
    }

    throw error;
    }
};

export { 
    createExecutionRecord,
    completeExecution,
    failExecution,
    getTaskForExecution,
    executeTask,
 };
