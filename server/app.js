import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import healthRouter from "./src/routes/health.routes.js";

const app = express()
app.set("turst proxy",1);
app.use(cookieParser());
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(helmet({contentSecuritypolicy:false}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));


//routes
app.use("/api/v1/health", healthRouter);


export default app;