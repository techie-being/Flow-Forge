
import Redis from "ioredis";

const workerRedis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

workerRedis.on("connect", () => {
    console.log("Worker Redis connected successfully");
});

workerRedis.on("error", (error) => {
    console.error("Worker Redis connection error:", error.message);
});

export default workerRedis;
