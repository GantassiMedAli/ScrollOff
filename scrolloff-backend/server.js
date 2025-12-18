import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./config/db.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test MySQL connection
db.query("SELECT 1", (err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ MySQL connected successfully");
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "scrolloff-secret-key-change-in-production";

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ==================== AUTH ROUTES ====================

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Query admin from database (assuming admin table exists)
    db.query(
      "SELECT * FROM admin WHERE username = ?",
      [username],
      async (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const admin = results[0];

        // Verify password (assuming password is hashed with bcrypt)
        const isValidPassword = await bcrypt.compare(password, admin.password);

        if (!isValidPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: admin.id, username: admin.username },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        res.json({
          token,
          admin: {
            id: admin.id,
            username: admin.username
          }
        });
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================== STATISTICS ====================

// Dashboard Stats
app.get("/api/admin/stats", verifyToken, (req, res) => {
  const stats = {};

  // Total users
  db.query("SELECT COUNT(*) as total FROM users", (err, results) => {
    if (err) {
      console.error("Error getting users count:", err);
      stats.totalUsers = 0;
    } else {
      stats.totalUsers = results[0].total;
    }

    // Total tests (results)
    db.query("SELECT COUNT(*) as total FROM results", (err, results) => {
      if (err) {
        console.error("Error getting results count:", err);
        stats.totalTests = 0;
      } else {
        stats.totalTests = results[0].total;
      }

      // Pending stories
      db.query(
        "SELECT COUNT(*) as total FROM stories WHERE statut = 'pending'",
        (err, results) => {
          if (err) {
            console.error("Error getting pending stories:", err);
            stats.pendingStories = 0;
          } else {
            stats.pendingStories = results[0].total;
          }

          // Active challenges
          db.query("SELECT COUNT(*) as total FROM challenges", (err, results) => {
            if (err) {
              console.error("Error getting challenges count:", err);
              stats.activeChallenges = 0;
            } else {
              stats.activeChallenges = results[0].total;
            }

            res.json(stats);
          });
        }
      );
    });
  });
});

// ==================== USERS ROUTES ====================

// Get all users
app.get("/api/admin/users", verifyToken, (req, res) => {
  db.query(
    "SELECT id, name, email, date_inscription, is_active FROM users ORDER BY date_inscription DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ error: "Failed to fetch users" });
      }
      res.json(results);
    }
  );
});

// Update user status (enable/disable)
app.patch("/api/admin/users/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  db.query(
    "UPDATE users SET is_active = ? WHERE id = ?",
    [is_active, id],
    (err, results) => {
      if (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ error: "Failed to update user" });
      }
      res.json({ message: "User updated successfully" });
    }
  );
});

// ==================== RESULTS ROUTES ====================

// Get results statistics
app.get("/api/admin/results/stats", verifyToken, (req, res) => {
  const stats = {};

  // Total tests
  db.query("SELECT COUNT(*) as total FROM results", (err, results) => {
    if (err) {
      stats.totalTests = 0;
    } else {
      stats.totalTests = results[0].total;
    }

    // Average score
    db.query("SELECT AVG(score) as avg FROM results", (err, results) => {
      if (err) {
        stats.averageScore = 0;
      } else {
        stats.averageScore = results[0].avg || 0;
      }

      // Distribution by level
      db.query(
        "SELECT niveau, COUNT(*) as count FROM results GROUP BY niveau",
        (err, results) => {
          if (err) {
            stats.distributionByLevel = [];
          } else {
            stats.distributionByLevel = results;
          }

          // Evolution by date
          db.query(
            "SELECT DATE(date_test) as date, COUNT(*) as count FROM results GROUP BY DATE(date_test) ORDER BY date DESC LIMIT 30",
            (err, results) => {
              if (err) {
                stats.evolutionByDate = [];
              } else {
                stats.evolutionByDate = results;
              }

              res.json(stats);
            }
          );
        }
      );
    });
  });
});

// ==================== STORIES ROUTES ====================

// Get all stories with filters
app.get("/api/admin/stories", verifyToken, (req, res) => {
  const { statut } = req.query;

  let query = "SELECT * FROM stories";
  const params = [];

  if (statut) {
    query += " WHERE statut = ?";
    params.push(statut);
  }

  query += " ORDER BY date_creation DESC";

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching stories:", err);
      return res.status(500).json({ error: "Failed to fetch stories" });
    }
    res.json(results);
  });
});

// Update story status (approve/reject)
app.patch("/api/admin/stories/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  if (!statut || !["pending", "approved", "rejected"].includes(statut)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.query(
    "UPDATE stories SET statut = ? WHERE id = ?",
    [statut, id],
    (err, results) => {
      if (err) {
        console.error("Error updating story:", err);
        return res.status(500).json({ error: "Failed to update story" });
      }
      res.json({ message: "Story updated successfully" });
    }
  );
});

// Delete story
app.delete("/api/admin/stories/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM stories WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error deleting story:", err);
      return res.status(500).json({ error: "Failed to delete story" });
    }
    res.json({ message: "Story deleted successfully" });
  });
});

// ==================== TIPS ROUTES ====================

// Get all tips
app.get("/api/admin/tips", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM tips ORDER BY id DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching tips:", err);
        return res.status(500).json({ error: "Failed to fetch tips" });
      }
      res.json(results);
    }
  );
});

// Get tip by ID
app.get("/api/admin/tips/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM tips WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error fetching tip:", err);
      return res.status(500).json({ error: "Failed to fetch tip" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Tip not found" });
    }
    res.json(results[0]);
  });
});

// Create tip
app.post("/api/admin/tips", verifyToken, (req, res) => {
  const { titre, contenu, niveau } = req.body;

  if (!titre || !contenu || !niveau) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "INSERT INTO tips (titre, contenu, niveau) VALUES (?, ?, ?)",
    [titre, contenu, niveau],
    (err, results) => {
      if (err) {
        console.error("Error creating tip:", err);
        return res.status(500).json({ error: "Failed to create tip" });
      }
      res.json({ id: results.insertId, message: "Tip created successfully" });
    }
  );
});

// Update tip
app.put("/api/admin/tips/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { titre, contenu, niveau } = req.body;

  if (!titre || !contenu || !niveau) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "UPDATE tips SET titre = ?, contenu = ?, niveau = ? WHERE id = ?",
    [titre, contenu, niveau, id],
    (err, results) => {
      if (err) {
        console.error("Error updating tip:", err);
        return res.status(500).json({ error: "Failed to update tip" });
      }
      res.json({ message: "Tip updated successfully" });
    }
  );
});

// Delete tip
app.delete("/api/admin/tips/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM tips WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error deleting tip:", err);
      return res.status(500).json({ error: "Failed to delete tip" });
    }
    res.json({ message: "Tip deleted successfully" });
  });
});

// ==================== RESOURCES ROUTES ====================

// Get all resources
app.get("/api/admin/resources", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM resources ORDER BY id DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching resources:", err);
        return res.status(500).json({ error: "Failed to fetch resources" });
      }
      res.json(results);
    }
  );
});

// Get resource by ID
app.get("/api/admin/resources/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM resources WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error fetching resource:", err);
      return res.status(500).json({ error: "Failed to fetch resource" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Resource not found" });
    }
    res.json(results[0]);
  });
});

// Create resource
app.post("/api/admin/resources", verifyToken, (req, res) => {
  const { titre, description, lien, type } = req.body;

  if (!titre || !description || !lien || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "INSERT INTO resources (titre, description, lien, type) VALUES (?, ?, ?, ?)",
    [titre, description, lien, type],
    (err, results) => {
      if (err) {
        console.error("Error creating resource:", err);
        return res.status(500).json({ error: "Failed to create resource" });
      }
      res.json({ id: results.insertId, message: "Resource created successfully" });
    }
  );
});

// Update resource
app.put("/api/admin/resources/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { titre, description, lien, type } = req.body;

  if (!titre || !description || !lien || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "UPDATE resources SET titre = ?, description = ?, lien = ?, type = ? WHERE id = ?",
    [titre, description, lien, type, id],
    (err, results) => {
      if (err) {
        console.error("Error updating resource:", err);
        return res.status(500).json({ error: "Failed to update resource" });
      }
      res.json({ message: "Resource updated successfully" });
    }
  );
});

// Delete resource
app.delete("/api/admin/resources/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM resources WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error deleting resource:", err);
      return res.status(500).json({ error: "Failed to delete resource" });
    }
    res.json({ message: "Resource deleted successfully" });
  });
});

// ==================== CHALLENGES ROUTES ====================

// Get all challenges
app.get("/api/admin/challenges", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM challenges ORDER BY id DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching challenges:", err);
        return res.status(500).json({ error: "Failed to fetch challenges" });
      }
      res.json(results);
    }
  );
});

// Get challenge by ID
app.get("/api/admin/challenges/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM challenges WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error fetching challenge:", err);
      return res.status(500).json({ error: "Failed to fetch challenge" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    res.json(results[0]);
  });
});

// Create challenge
app.post("/api/admin/challenges", verifyToken, (req, res) => {
  const { titre, description, niveau, duree } = req.body;

  if (!titre || !description || !niveau || !duree) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "INSERT INTO challenges (titre, description, niveau, duree) VALUES (?, ?, ?, ?)",
    [titre, description, niveau, duree],
    (err, results) => {
      if (err) {
        console.error("Error creating challenge:", err);
        return res.status(500).json({ error: "Failed to create challenge" });
      }
      res.json({ id: results.insertId, message: "Challenge created successfully" });
    }
  );
});

// Update challenge
app.put("/api/admin/challenges/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { titre, description, niveau, duree } = req.body;

  if (!titre || !description || !niveau || !duree) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "UPDATE challenges SET titre = ?, description = ?, niveau = ?, duree = ? WHERE id = ?",
    [titre, description, niveau, duree, id],
    (err, results) => {
      if (err) {
        console.error("Error updating challenge:", err);
        return res.status(500).json({ error: "Failed to update challenge" });
      }
      res.json({ message: "Challenge updated successfully" });
    }
  );
});

// Delete challenge
app.delete("/api/admin/challenges/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM challenges WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error deleting challenge:", err);
      return res.status(500).json({ error: "Failed to delete challenge" });
    }
    res.json({ message: "Challenge deleted successfully" });
  });
});

// Route test
app.get("/", (req, res) => {
  res.send("API ScrollOff is working 😎 (MySQL only)");
});

// Start server
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
