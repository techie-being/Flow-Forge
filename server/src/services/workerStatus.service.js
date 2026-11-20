
import { pool } from "../db/db.js";

// Mark worker online when its process starts
const markWorkerOnline = async (workerId) => {
    await pool.query(
        `UPDATE workers
         SET status = 'idle',
             last_heartbeat = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [workerId]
    );
};

// Refresh worker heartbeat
const updateWorkerHeartbeat = async (workerId) => {
    await pool.query(
        `UPDATE workers
         SET last_heartbeat = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [workerId]
    );
};

// Mark worker offline during graceful shutdown
const markWorkerOffline = async (workerId) => {
    await pool.query(
        `UPDATE workers
         SET status = 'offline'
         WHERE id = $1`,
        [workerId]
    );
};

// Mark worker as busy when it starts processing a job
const markWorkerBusy = async (workerId) => {
    await pool.query(
        `UPDATE workers
         SET status = 'busy',
             last_heartbeat = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [workerId]
    );
};

// Mark worker as idle after job execution
const markWorkerIdle = async (workerId) => {
    await pool.query(
        `UPDATE workers
         SET status = 'idle',
             last_heartbeat = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [workerId]
    );
};

export {
    markWorkerOnline,
    updateWorkerHeartbeat,
    markWorkerOffline,
    markWorkerBusy,
    markWorkerIdle,
    
};
