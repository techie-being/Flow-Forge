
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import {pool} from "../db/db.js";
import { taskFileUploader, cloudinary } from "../config/cloudinary.js";

const createTask = asyncHandler(async (req, res) => {
    let uploadedFile;

    try {
        // 1. Extract task details
        const { description } = req.body;
        //const userId = req.user?.id;
        const userId = 1;
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


export default createTask;
