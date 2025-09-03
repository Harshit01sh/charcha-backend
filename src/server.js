const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("../src/models/index")

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

(async () => {
    try {
        await db.sequelize.sync();
        console.log("✅ Models synced!");
    } catch (error) {
        console.error("❌ DB connection failed:", error.message);
    }
})();

app.get("/", (req, res) => res.send("Hello World"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
