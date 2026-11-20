
import { pool } from "../db/db.js";

// Find and reserve an available worker
const reserveAvailableWorker = async () => {
    const result = await pool.query(
        `WITH available_worker AS (
            SELECT id
            FROM workers
            WHERE status = 'idle'
              AND last_heartbeat >=
                  CURRENT_TIMESTAMP - INTERVAL '30 seconds'
            ORDER BY last_heartbeat ASC, id ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
        UPDATE workers
        SET status = 'busy',
            last_heartbeat = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM available_worker)
        RETURNING id, name, worker_type, status`,
    );

    return result.rows[0] || null;
};

// Release a reserved worker if job dispatch fails
const releaseWorker = async (workerId) => {
    await pool.query(
        `UPDATE workers
         SET status = 'idle',
             last_heartbeat = CURRENT_TIMESTAMP
         WHERE id = $1
           AND status = 'busy'`,
        [workerId]
    );
};

export {
    reserveAvailableWorker,
    releaseWorker,
};
