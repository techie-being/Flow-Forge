import { Worker } from "bullmq";
import workerRedis from "../config/workerRedis.js";
import { executeTask } from "../services/workerExecution.service.js";
import processTask from "./taskProcessor.js";

const startWorker = (workerId, workerDbId, queueName) => {
  const worker = new Worker(
    queueName,

    async (job) => {
      console.log(`Worker ${workerId} received job:`, job.id);

      const { taskId } = job.data;

      return await executeTask({
        taskId,
        workerId: workerDbId,
        processor: processTask,
      });
    },

    {
      connection: workerRedis,
    },
  );

  worker.on("completed", (job) => {
    console.log(`Worker ${workerId} completed job: ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Worker ${workerId} failed job ${job?.id}:`, error.message);
  });

  worker.on("error", (error) => {
    console.error(`Worker ${workerId} error:`, error.message);
  });

  console.log(`Worker ${workerId} listening on ${queueName}`);

  return worker;
};

export default startWorker;
