import asyncHandler from "../utils/asyncHandler.js";
import apiResponse from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";
import pool from "../db/db.js";

const createTask = asyncHandler(async (req, res) => {
  // 1. Extract task details
  const { description } = req.body;

  // 2. Validate request data
  if (typeof description !== "string" || !description.trim()) {
    throw new apiError(400, "Please provide a valid task description");
  }

  // 3. Insert task into PostgreSQL
  const query = `
        INSERT INTO tasks (description)
        VALUES ($1)
        RETURNING *;
    `;

  const result = await pool.query(query, [description.trim()]);

  // 4. Return success response
  return res
    .status(201)
    .json(new apiResponse(201, result.rows[0], "Task created successfully"));
});

export default createTask;
