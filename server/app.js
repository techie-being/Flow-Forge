import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

//router
import healthRouter from "./src/routes/health.routes.js";
import taskRouter from "./src/routes/task.routes.js";
import userRouter from "./src/routes/user.routes.js";
import workerRouter from "./src/routes/worker.routes.js";

//app configuration
const app = express()
app.set("turst proxy",1);
app.use(cookieParser());
app.use(cors({
    origin:process.env.LOCALHOST_FRONTEND_URL,
    credentials:true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(helmet({contentSecuritypolicy:false}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));


//routes
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/tasks",taskRouter);
app.use("/api/v1/users",userRouter);
app.use("/api/v1/workers",workerRouter);


export default app;