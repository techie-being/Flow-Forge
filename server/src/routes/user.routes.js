import { Router } from "express";

import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    getUserProfile
} from "../controllers/user.controllers.js";
import {verifyJwt} from "../middlewares/auth.middleware.js";
import {optionalVerifyJwt} from "../middlewares/auth.middleware.js";

const userRouter = Router();

// Public routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/refresh-token", refreshAccessToken);

// Protected routes
userRouter.post("/logout", verifyJwt, logoutUser);
userRouter.get("/me", verifyJwt, getCurrentUser);

// Public profile, with optional authentication
userRouter.get("/profile/:username", optionalVerifyJwt, getUserProfile);

export default userRouter;
