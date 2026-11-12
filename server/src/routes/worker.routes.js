import {Router} from "express";

import {
    registerWorker,
    getAllWorkers,
    getWorkerById,
    updateWorkerStatus,
} from "../controllers/worker.controllers.js";

const workerRouter = Router();

workerRouter.post("/register",registerWorker);
workerRouter.get("/get-all",getAllWorkers);
workerRouter.get("/by/:id",getWorkerById);
workerRouter.patch("/status/:id",updateWorkerStatus);


export default workerRouter;