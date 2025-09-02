const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("../src/config/db")

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Database connected successfully!");
        connection.release(); // always release back to pool
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
    }
})();

app.get("/", (req, res) => res.send("Hello World"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
