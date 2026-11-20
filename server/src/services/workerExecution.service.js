import { pool } from "../db/db.js";
import { markWorkerBusy, markWorkerIdle } from "./workerStatus.service.js";

const recoverStaleExecutions = async (taskId) => {
  const result = await pool.query(
    `UPDATE task_executions
         SET status = 'failed',
             error_message = $1,
             completed_at = CURRENT_TIMESTAMP
         WHERE task_id = $2
           AND status = 'running'
         RETURNING id`,
    ["Execution interrupted. Job was recovered after worker restart.", taskId],
  );

  return result.rows;
};

const createExecutionRecord = async (taskId, workerId) => {
  // Find the next attempt number for this task
  const attemptResult = await pool.query(
    `SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_attempt
         FROM task_executions
         WHERE task_id = $1`,
    [taskId],
  );

  const attemptNumber = attemptResult.rows[0].next_attempt;

  // Create execution record
  const result = await pool.query(
    `INSERT INTO task_executions
         (task_id, worker_id, attempt_number, status, started_at)
         VALUES ($1, $2, $3, 'running', CURRENT_TIMESTAMP)
         RETURNING *`,
    [taskId, workerId, attemptNumber],
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
    [JSON.stringify(resultData), executionId],
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
    [errorMessage, executionId],
  );

  return result.rows[0];
};

const getTaskForExecution = async (taskId) => {
  const result = await pool.query(
    `SELECT *
         FROM tasks
         WHERE id = $1`,
    [taskId],
  );

  return result.rows[0] || null;
};

const executeTask = async ({ taskId, workerId, processor }) => {
  let execution;

  try {
    // 1. Mark worker busy
    await markWorkerBusy(workerId);

    // 2. Recover previous interrupted executions
    await recoverStaleExecutions(taskId);

    // 3. Create new execution record
    execution = await createExecutionRecord(taskId, workerId);

    // 4. Retrieve task details
    const task = await getTaskForExecution(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    await pool.query(
      `UPDATE tasks
     SET status = 'running',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
      [taskId],
    );

    // 5. Execute task
    const taskResult = await processor(task);

    // 6. Save result
    const completedExecution = await completeExecution(
      execution.id,
      taskResult,
    );

    await pool.query(
      `UPDATE tasks
     SET status = 'completed',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
      [taskId],
    );

    return completedExecution;
  } catch (error) {
    if (execution) {
      try {
        await failExecution(execution.id, error.message);

        await pool.query(
          `UPDATE tasks
             SET status = 'failed',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
          [taskId],
        );
      } catch (updateError) {
        console.error(
          "Failed to update execution/task status:",
          updateError.message,
        );
      }
    }
    throw error;
  } finally {
    // 7. Return worker to idle
    try {
      await markWorkerIdle(workerId);
    } catch (error) {
      console.error(`Failed to mark worker ${workerId} idle:`, error.message);
    }
  }
};

export {
  createExecutionRecord,
  completeExecution,
  failExecution,
  getTaskForExecution,
  executeTask,
  recoverStaleExecutions,
};
