import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Handle unexpected errors from idle clients in the pool
pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error.message);
});

// Verify the database connection
const connectDB = async () => {
    try {
        const client = await pool.connect();

        console.log("PostgreSQL connected successfully");

        client.release();
    } catch (error) {
        console.error("PostgreSQL connection failed:", error.message);
        throw error;
    }
};

export  {pool,connectDB};


