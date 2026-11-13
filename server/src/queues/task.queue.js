import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

const taskQueue = new Queue("task-queue", {
    connection: redisConnection,
});

export default taskQueue;