import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { pool } from "../db/db.js";
import bcrypt from "bcrypt";
import  {verifyJwt} from "../middlewares/auth.middleware.js";
import jwt from "jsonwebtoken";
import { cloudinaryUploader } from "../config/cloudinary.js";

import {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    AccessTokenOptions,
    RefreshTokenOptions
} from "../utils/token.utils.js";

const registerUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        !password.trim()
    ) {
        throw new ApiError(400, "Email and password are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check whether user already exists
    const existingUser = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
        throw new ApiError(409, "User with this email already exists");
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const result = await pool.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, role, profile_image_url`,
        [normalizedEmail, normalizedEmail, hashedPassword]
    );

    const user = result.rows[0];

    // 5. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 6. Hash refresh token
    const hashedRefreshToken = hashToken(refreshToken);

    // 7. Store refresh token hash
    await pool.query(
        `UPDATE users
         SET refresh_token_hash = $1
         WHERE id = $2`,
        [hashedRefreshToken, user.id]
    );

    // 8. Send response
    return res
        .status(201)
        .cookie("accessToken", accessToken, AccessTokenOptions)
        .cookie("refreshToken", refreshToken, RefreshTokenOptions)
        .json(
            new ApiResponse(
                201,
                { user },
                "User registered successfully"
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    // 1. Validate fields
    if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        !password.trim()
    ) {
        throw new ApiError(400, "Email and password are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Find user
    const result = await pool.query(
        `SELECT id, username, name, email, password_hash,
                role, profile_image_url
         FROM users
         WHERE email = $1`,
        [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // 4. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 5. Hash refresh token
    const hashedRefreshToken = hashToken(refreshToken);

    // 6. Store refresh token hash
    await pool.query(
        `UPDATE users
         SET refresh_token_hash = $1
         WHERE id = $2`,
        [hashedRefreshToken, user.id]
    );

    // 7. Remove password from response
    delete user.password_hash;

    // 8. Send response
    return res
        .status(200)
        .cookie("accessToken", accessToken, AccessTokenOptions)
        .cookie("refreshToken", refreshToken, RefreshTokenOptions)
        .json(
            new ApiResponse(
                200,
                { user },
                "User logged in successfully"
            )
        );
});

const setupAccount = asyncHandler(async (req, res) => {
    // 1. Retrieve fields and uploaded avatar
    const { fullname } = req.body;
    const avatarLocalPath = req.file?.path;

    // 2. Validate input
    if (typeof fullname !== "string" || !fullname.trim()) {
        throw new ApiError(400, "Full name is required");
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    // 3. Upload avatar to Cloudinary
    const avatar = await cloudinaryUploader(avatarLocalPath);

    if (!avatar?.url || !avatar?.public_id) {
        throw new ApiError(500, "Error while uploading avatar");
    }

    // 4. Update user in PostgreSQL
    const result = await pool.query(
        `UPDATE users
         SET name = $1,
             profile_image_url = $2,
             profile_image_public_id = $3
         WHERE id = $4
         RETURNING id, username, name, email, role,
                   profile_image_url, created_at`,
        [
            fullname.trim(),
            avatar.url,
            avatar.public_id,
            req.user.id
        ]
    );

    const user = result.rows[0];

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // 5. Return response
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Account setup completed successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {

    // 1. Check authenticated user
    if (!req.user?.id) {
        throw new ApiError(401, "Unauthorized request");
    }

    // 2. Invalidate refresh token
    await pool.query(
        `UPDATE users
         SET refresh_token_hash = NULL
         WHERE id = $1`,
        [req.user.id]
    );

    // 3. Clear authentication cookies
    return res
        .status(200)
        .clearCookie("accessToken", AccessTokenOptions)
        .clearCookie("refreshToken", RefreshTokenOptions)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        );
});


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "User is currently logged in"
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {

    // 1. Extract refresh token
    const incomingRefreshToken = (
        req.cookies?.refreshToken || req.body?.refreshToken
    )?.trim();

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is missing");
    }

    // 2. Verify refresh token
    let decodedToken;

    try {
        decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    // 3. Find user in PostgreSQL
    const result = await pool.query(
        `SELECT id, username, name, email, role, refresh_token_hash
         FROM users
         WHERE id = $1`,
        [decodedToken.id]
    );

    const user = result.rows[0];

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // 4. Compare incoming token hash with stored hash
    const incomingTokenHash = hashToken(incomingRefreshToken);

    if (
        !user.refresh_token_hash ||
        incomingTokenHash !== user.refresh_token_hash
    ) {
        throw new ApiError(401, "Refresh token is expired or already used");
    }

    // 5. Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const newRefreshTokenHash = hashToken(newRefreshToken);

    // 6. Rotate refresh token in database
    const updateResult = await pool.query(
        `UPDATE users
         SET refresh_token_hash = $1
         WHERE id = $2 AND refresh_token_hash = $3
         RETURNING id`,
        [newRefreshTokenHash, user.id, incomingTokenHash]
    );

    if (updateResult.rowCount === 0) {
        throw new ApiError(401, "Refresh token is expired or already used");
    }

    // 7. Send new tokens through cookies
    return res
        .status(200)
        .cookie("accessToken", newAccessToken, AccessTokenOptions)
        .cookie("refreshToken", newRefreshToken, RefreshTokenOptions)
        .json(
            new ApiResponse(
                200,
                {},
                "Tokens refreshed successfully"
            )
        );
});

const getUserProfile = asyncHandler(async (req, res) => {

    const { username } = req.params;

    // 1. Validate username
    if (typeof username !== "string" || !username.trim()) {
        throw new ApiError(400, "Username cannot be empty");
    }

    // 2. Get logged-in user ID (if authenticated)
    const loggedInUserId = req.user?.id || null;

    // 3. Fetch profile from PostgreSQL
    const result = await pool.query(
        `SELECT
            id,
            username,
            COALESCE(NULLIF(name, ''), username) AS name,
            profile_image_url,
            CASE
                WHEN id = $2 THEN email
                ELSE NULL
            END AS email,
            (id = $2) AS "isOwner"
         FROM users
         WHERE LOWER(username) = LOWER($1)`,
        [username.trim(), loggedInUserId]
    );

    const profile = result.rows[0];

    // 4. Check whether profile exists
    if (!profile) {
        throw new ApiError(404, "User does not exist");
    }

    // 5. Return profile
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                profile,
                "User profile fetched successfully"
            )
        );
});



export { registerUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken,
    setupAccount,
    loginUser,
    getUserProfile,

 };