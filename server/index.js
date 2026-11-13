import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./src/db/db.js";
import redisConnection from "./src/config/redis.js";
import taskQueue from "./src/queues/task.queue.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {

    //postgreSQL connection
    await connectDB();

    //redis connection
    const redisStatus = await redisConnection.ping();
    console.log("Redis status:", redisStatus);
    
    //bullMQ connection 
    const bullMqStatus = await taskQueue.waitUntilReady();
    console.log("BullMQ status:bullMQ queue is ready");

    app.listen(PORT, () => {
      console.log(`FlowForge server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
