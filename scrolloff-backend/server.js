import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Pour lire JSON
app.use(express.json());

// Connect to MongoDB
if (!process.env.MONGO_URI) {
  console.error("❌ Error: MONGO_URI is not defined in .env file");
  console.log("💡 Please create a .env file with: MONGO_URI=your_mongodb_connection_string");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✔️"))
  .catch(err => console.log("MongoDB Error ❌", err));

// Démarrer le serveur
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
app.get("/", (req, res) => {
  res.send("API ScrollOff is working 😎");
});



