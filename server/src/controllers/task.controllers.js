
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import {pool} from "../db/db.js";
import { taskFileUploader, cloudinary } from "../config/cloudinary.js";
import apiError from "../utils/apiError.js";

const createTask = asyncHandler(async (req, res) => {
    let uploadedFile;

    try {
        // 1. Extract task details
        const { description } = req.body;
        //const userId = req.user?.id;
        const userId = req.user?.id;
        // 2. Validate authenticated user
        if (!userId) {
            throw new ApiError(401, "Unauthorized request");
        }

        // 3. Validate description
        if (typeof description !== "string" || !description.trim()) {
            throw new ApiError(400, "Please provide a valid task description");
        }

        // 4. Validate uploaded file
        if (!req.file) {
            throw new ApiError(400, "Please upload a PDF file");
        }

        // 5. Upload file to Cloudinary
        uploadedFile = await taskFileUploader(req.file.path);

        // 6. Insert task into PostgreSQL
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

        // 7. Return success response
        return res.status(201).json(
            new ApiResponse(
                201,
                result.rows[0],
                "Task submitted successfully"
            )
        );

    } catch (error) {
        // 8. Remove Cloudinary file if database insertion fails
        if (uploadedFile?.public_id) {
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
        throw new ApiError(401, "Unauthorized request");
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
        throw new ApiError(400, "Invalid task ID");
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
        throw new ApiError(404, "Task not found");
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
        throw new ApiError(400, "Invalid task ID");
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
        throw new ApiError(404, "Task not found");
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
            throw new ApiError(500, "Failed to delete task file from Cloudinary");
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
