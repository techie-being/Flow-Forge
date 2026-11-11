import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import ApiError from "./apiError.js";


const generateAccessToken = (user) => {
    if (!user || !user.id || !user.email || !user.role) {
        throw new ApiError(400, "Valid user details are required to generate access token");
    }

    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.ACCESS_TOKEN_EXPIRY) {
        throw new ApiError(500, "Access token configuration is missing");
    }

    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

const generateRefreshToken = (user) => {
    if (!user || !user.id) {
        throw new ApiError(400, "Valid user ID is required to generate refresh token");
    }

    if (!process.env.REFRESH_TOKEN_SECRET || !process.env.REFRESH_TOKEN_EXPIRY) {
        throw new ApiError(500, "Refresh token configuration is missing");
    }

    return jwt.sign(
        {
            id: user.id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

const hashToken = (token) => {
    if (typeof token !== "string" || !token.trim()) {
        throw new ApiError(400, "Valid token is required for hashing");
    }

    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

const isProduction = process.env.NODE_ENV === "production";

const AccessTokenOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000
};

const RefreshTokenOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

export {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    AccessTokenOptions,
    RefreshTokenOptions
};