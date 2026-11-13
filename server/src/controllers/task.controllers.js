
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import {pool} from "../db/db.js";
import { taskFileUploader, cloudinary } from "../config/cloudinary.js";
import apiError from "../utils/apiError.js";
import addTaskJob from "../services/taskQueue.service.js";



//potential change in future for reliability
const createTask = asyncHandler(async (req, res) => {
    let uploadedFile;
    let taskCreated = false;

    try {
        const { description } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            throw new apiError(401, "Unauthorized request");
        }

        if (typeof description !== "string" || !description.trim()) {
            throw new apiError(400, "Please provide a valid task description");
        }

        if (!req.file) {
            throw new apiError(400, "Please upload a PDF file");
        }

        // 1. Upload PDF to Cloudinary
        uploadedFile = await taskFileUploader(req.file.path);

        // 2. Insert task into PostgreSQL
        const query = `
            INSERT INTO tasks (
                user_id,
                title,
                description,
                file_name,
                file_url,
                file_public_id
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;

        const values = [
            userId,
            req.file.originalname,
            description.trim(),
            req.file.originalname,
            uploadedFile.secure_url,
            uploadedFile.public_id
        ];

        const result = await pool.query(query, values);
        const task = result.rows[0];

        taskCreated = true;

        // 3. Add task to BullMQ queue
        // console.log(task.id);
        await addTaskJob(task.id);

        // 4. Return response
        return res.status(201).json(
            new ApiResponse(
                201,
                task,
                "Task submitted and queued successfully"
            )
        );

    } catch (error) {

        // Clean up Cloudinary only if task insertion failed
        if (uploadedFile?.public_id && !taskCreated) {
            try {
                await cloudinary.uploader.destroy(
                    uploadedFile.public_id,
                    { resource_type: "image" }
                );
            } catch (cleanupError) {
                console.error("Cloudinary cleanup failed:", cleanupError.message);
            }
        }

        throw error;
    }
});

const getUserTasks = asyncHandler(async (req, res) => {

    const userId = req.user?.id;

    if (!userId) {
        throw new apiError(401, "Unauthorized request");
    }

    const result = await pool.query(
        `SELECT *
         FROM tasks
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );

    // if(!result){
    //     throw new apiError("404","userId does not exist");
    // }

    return res.status(200).json(
        new ApiResponse(
            200,
            result.rows,
            "User tasks fetched successfully"
        )
    );
});

const getTaskById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate task ID
    const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
        throw new apiError(400, "Invalid task ID");
    }

    const userId = req.user.id;

    const result = await pool.query(
        `SELECT *
         FROM tasks
         WHERE id = $1 AND user_id = $2`,
        [taskId, userId]
    );

    const task = result.rows[0];

    if (!task) {
        throw new apiError(404, "Task not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            task,
            "Task fetched successfully"
        )
    );
});

const deleteTask = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate task ID
    const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
        throw new apiError(400, "Invalid task ID");
    }

    const userId = req.user.id;

    // Find task belonging to the logged-in user
    const result = await pool.query(
        `SELECT id, file_public_id
         FROM tasks
         WHERE id = $1 AND user_id = $2`,
        [taskId, userId]
    );

    const task = result.rows[0];

    if (!task) {
        throw new apiError(404, "Task not found");
    }

    // Delete PDF from Cloudinary
    if (task.file_public_id) {
        const cloudinaryResponse = await cloudinary.uploader.destroy(
            task.file_public_id,
            { resource_type: "image" }
        );

        if (
            cloudinaryResponse.result !== "ok" &&
            cloudinaryResponse.result !== "not found"
        ) {
            throw new apiError(500, "Failed to delete task file from Cloudinary");
        }
    }

    // Delete task record from PostgreSQL
    await pool.query(
        `DELETE FROM tasks
         WHERE id = $1 AND user_id = $2`,
        [taskId, userId]
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Task and associated file deleted successfully"
        )
    );
});


export {
    createTask,
    getUserTasks,
    getTaskById,
    deleteTask,
}
