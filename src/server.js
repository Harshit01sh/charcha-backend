const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("../src/config/db")

dotenv.config();
console.log(pool)
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Hello World"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
