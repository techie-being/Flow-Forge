import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { pool } from "../db/db.js";

const registerWorker = asyncHandler(async (req, res) => {
    const { name, worker_type, max_concurrent_tasks } = req.body;

    // 1. Validate worker name
    if (typeof name !== "string" || !name.trim()) {
        throw new ApiError(400, "Please provide a valid worker name");
    }

    // 2. Validate worker type
    if (!["node", "python"].includes(worker_type)) {
        throw new ApiError(400, "Worker type must be node or python");
    }

    // 3. Validate worker capacity
    const maxTasks = max_concurrent_tasks ?? 1;

    if (!Number.isInteger(maxTasks) || maxTasks <= 0) {
        throw new ApiError(400, "Maximum concurrent tasks must be a positive integer");
    }

    // 4. Insert worker into PostgreSQL
    const result = await pool.query(
        `INSERT INTO workers (
            name,
            worker_type,
            max_concurrent_tasks
        )
        VALUES ($1, $2, $3)
        RETURNING *`,
        [name.trim(), worker_type, maxTasks]
    );

    // 5. Return response
    return res.status(201).json(
        new ApiResponse(
            201,
            result.rows[0],
            "Worker registered successfully"
        )
    );
});


const getAllWorkers = asyncHandler(async (req, res) => {
    const result = await pool.query(
        `SELECT *
         FROM workers
         ORDER BY created_at DESC`
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            result.rows,
            "Workers fetched successfully"
        )
    );
});


const getWorkerById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const workerId = Number(id);

    if (!Number.isInteger(workerId) || workerId <= 0) {
        throw new ApiError(400, "Invalid worker ID");
    }

    const result = await pool.query(
        `SELECT *
         FROM workers
         WHERE id = $1`,
        [workerId]
    );

    const worker = result.rows[0];

    if (!worker) {
        throw new ApiError(404, "Worker not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            worker,
            "Worker fetched successfully"
        )
    );
});


const updateWorkerStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const workerId = Number(id);

    if (!Number.isInteger(workerId) || workerId <= 0) {
        throw new ApiError(400, "Invalid worker ID");
    }

    const allowedStatuses = ["idle", "busy", "offline", "error"];

    if (!allowedStatuses.includes(status)) {
        throw new ApiError(400, "Invalid worker status");
    }

    const result = await pool.query(
        `UPDATE workers
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, workerId]
    );

    const worker = result.rows[0];

    if (!worker) {
        throw new ApiError(404, "Worker not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            worker,
            "Worker status updated successfully"
        )
    );
});

//delete worker in future if needed





export { 
    registerWorker,
    getAllWorkers,
    getWorkerById,
    updateWorkerStatus,
 };
