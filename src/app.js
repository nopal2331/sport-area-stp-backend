const express = require("express");
const dotenv = require("dotenv");
const routes = require("./routes");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "https://sport-area-stp.vercel.app",
  })
);

const uploadsPath = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsPath));

app.use("/api", routes);

module.exports = app;
