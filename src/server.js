const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sequelize = require("../src/config/sequelize")
const User = require("../src/models/user.models");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// (async () => {
//     try {
//         const connection = await sequelize.sync();
//         console.log("✅ Database connected successfully!");
//     } catch (err) {
//         console.error(" Database connection failed:", err.message);
//     }
// })();
(async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connected!");
        await sequelize.sync(); // creates table if not exists
        console.log("✅ Models synced!");
    } catch (error) {
        console.error("❌ DB connection failed:", error.message);
    }
})();

app.get("/", (req, res) => res.send("Hello World"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
