import { Router } from "express";
import createTask from "../controllers/task.controllers.js";
import  uploadTaskFile  from "../middlewares/uploadTaskFile.js";

const taskRouter = Router();

taskRouter.post(
    "/",
    uploadTaskFile.single("file"),
    createTask
);

export default taskRouter;
