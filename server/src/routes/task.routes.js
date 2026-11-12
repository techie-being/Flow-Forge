import { Router } from "express";
import {
    createTask,
    deleteTask,
    getTaskById,
    getUserTasks,
} from "../controllers/task.controllers.js";
import  uploadTaskFile  from "../middlewares/uploadTaskFile.js";
import {verifyJwt} from "../middlewares/auth.middleware.js";
const taskRouter = Router();

taskRouter.post(
    "/",
    verifyJwt,
    uploadTaskFile.single("file"),
    createTask
);

taskRouter.get("/get-all-task",verifyJwt,getUserTasks);

taskRouter.get("/taskBy/:id", verifyJwt, getTaskById);

taskRouter.delete("/:id",verifyJwt,deleteTask);

export default taskRouter;
