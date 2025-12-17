import express from "express";
import dotenv from "dotenv";
import { db } from "./config/db.js";

dotenv.config();

const app = express();

// Lire JSON
app.use(express.json());

// Test MySQL connection
db.query("SELECT 1", (err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ MySQL connected successfully");
  }
});

// Route test
app.get("/", (req, res) => {
  res.send("API ScrollOff is working 😎 (MySQL only)");
});

// Start server
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
