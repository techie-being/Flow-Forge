import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { pool } from "../db/db.js";

const verifyJwt = asyncHandler(async (req, res, next) => {

    const token =
        req.cookies?.accessToken ||
        req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    let decodedToken;

    try {
        decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
    } catch (error) {
        throw new ApiError(401, "Invalid or expired access token");
    }

    const result = await pool.query(
        `SELECT id, username, name, email, role,
                profile_image_url
         FROM users
         WHERE id = $1`,
        [decodedToken.id]
    );

    const user = result.rows[0];

    if (!user) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = user;

    next();
});

const optionalVerifyJwt = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.headers.authorization?.replace("Bearer ", "");

    // No token: continue as a public visitor.
    if (!token) {
        req.user = null;
        return next();
    }

    let decodedToken;

    try {
        decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
    } catch (error) {
        req.user = null;
        return next();
    }

    const result = await pool.query(
        `SELECT id, username, name, email, role, profile_image_url
         FROM users
         WHERE id = $1`,
        [decodedToken.id]
    );

    req.user = result.rows[0] || null;

    next();
});

export{
    verifyJwt,
    optionalVerifyJwt
}