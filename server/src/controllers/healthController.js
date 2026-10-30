
import { pool } from "../db/db.js";

const healthCheck = async (req, res) => {
    try {
        await pool.query("SELECT 1");

        return res.status(200).json({
            success: true,
            message: "FlowForge is healthy",
            services: {
                api: "up",
                database: "up",
            },
        });
    } catch (error) {
        console.error("Health check failed:", error.message);

        return res.status(503).json({
            success: false,
            message: "FlowForge is unhealthy",
            services: {
                api: "up",
                database: "down",
            },
        });
    }
};

export { healthCheck };




