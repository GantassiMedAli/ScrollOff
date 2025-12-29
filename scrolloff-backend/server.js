import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./config/db.js";

dotenv.config();

const app = express();

// Middleware
// Use CORS for all routes and allow Authorization header — remove the app.options('*', cors())
// which causes an Express path parsing error in newer path-to-regexp versions.
app.use(cors({ origin: true, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// Test MySQL connection
db.query("SELECT 1", (err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ MySQL connected successfully");
  }
});

// JWT Secret (set this in your .env for local development and to match any other environment)
const JWT_SECRET = process.env.JWT_SECRET || "scrolloff-secret-key-change-in-production";
if (!process.env.JWT_SECRET) {
  // Warn in development when a secret isn't set so the developer knows to add one locally.
  console.warn("⚠️  JWT_SECRET not set in .env - using default development secret.\nSet JWT_SECRET in .env to a strong value and make sure the frontend/client and other services use the same secret when sharing tokens.");
}

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  // Accept token from Authorization header, x-access-token header, or request body (convenient for testing)
  let authHeader = req.headers.authorization || req.headers['x-access-token'] || req.body?.token;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Normalize token string (remove Bearer prefix, surrounding quotes, and whitespace)
  let token = authHeader;
  if (typeof token === 'string') {
    token = token.trim();
    if (token.toLowerCase().startsWith('bearer ')) {
      token = token.slice(7).trim();
    }
    // remove surrounding quotes if present
    token = token.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    // attach raw token for easier debugging/inspection in logs
    req.token = token;
    next();
  } catch (error) {
    // Log the exact verification failure to help debugging locally (signature, expired, malformed, etc.)
    console.debug('JWT verification failed:', error.message);
    // Return the message "Token mismatch" for compatibility with some clients that expect that wording.
    return res.status(401).json({ error: "Token mismatch" });
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

        // Verify password (supports bcrypt-hashed passwords and legacy plaintext DB entries)
        const storedPass = admin.mot_de_passe || admin.password;
        let isValidPassword = false;
        if (storedPass && (storedPass.startsWith('$2a$') || storedPass.startsWith('$2b$') || storedPass.startsWith('$2y$'))) {
          isValidPassword = await bcrypt.compare(password, storedPass);
        } else {
          // Fallback for plaintext password in DB (migrate to hashed passwords asap)
          isValidPassword = password === storedPass;
        }

        if (!isValidPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token (use id_admin as id)
        const token = jwt.sign(
          { id: admin.id_admin, username: admin.username },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        res.json({
          token,
          admin: {
            id: admin.id_admin,
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

  // Total users (table utilisateur in DB)
  db.query("SELECT COUNT(*) as total FROM utilisateur", (err, results) => {
    if (err) {
      console.error("Error getting users count:", err);
      stats.totalUsers = 0;
    } else {
      stats.totalUsers = results[0].total;
    }

    // Total tests (table resultat in DB)
    db.query("SELECT COUNT(*) as total FROM resultat", (err, results) => {
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

// Get all users (map utilisateur fields to API contract)
app.get("/api/admin/users", verifyToken, (req, res) => {
  // Note: the utilisateur table does not have an is_active column in the current schema.
  // Return a default is_active = 1 so frontend UI can render status without error.
  db.query(
    "SELECT id_user AS id, nom AS name, email, date_inscription, 1 AS is_active FROM utilisateur ORDER BY date_inscription DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ error: "Failed to fetch users" });
      }
      res.json(results);
    }
  );
});

// Update user status (enable/disable) - operates on utilisateur
app.patch("/api/admin/users/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  // The utilisateur table may not have is_active column in the current schema.
  // Check for the column first; if it's missing, return success but do not attempt to update
  // (prevents SQL errors and keeps server stable). Recommend adding is_active column
  // in a future migration to make this persistent.
  db.query("SHOW COLUMNS FROM utilisateur LIKE 'is_active'", (err, cols) => {
    if (err) {
      console.error("Error checking user schema:", err);
      return res.status(500).json({ error: "Failed to update user" });
    }

    if (!cols || cols.length === 0) {
      console.warn("is_active column missing; ignoring update for user id", id);
      return res.json({ message: "User status feature not available (schema missing), client updated locally" });
    }

    db.query(
      "UPDATE utilisateur SET is_active = ? WHERE id_user = ?",
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
});

// ==================== RESULTS ROUTES ====================

// Get results statistics
app.get("/api/admin/results/stats", verifyToken, (req, res) => {
  const stats = {};

  // Total tests (table resultat)
  db.query("SELECT COUNT(*) as total FROM resultat", (err, results) => {
    if (err) {
      stats.totalTests = 0;
    } else {
      stats.totalTests = results[0].total;
    }

    // Average score
    db.query("SELECT AVG(score) as avg FROM resultat", (err, results) => {
      if (err) {
        stats.averageScore = 0;
      } else {
        stats.averageScore = results[0].avg || 0;
      }

      // Distribution by level
      db.query(
        "SELECT niveau, COUNT(*) as count FROM resultat GROUP BY niveau",
        (err, results) => {
          if (err) {
            stats.distributionByLevel = [];
          } else {
            stats.distributionByLevel = results;
          }

          // Evolution by date
          db.query(
            "SELECT DATE(date_test) as date, COUNT(*) as count FROM resultat GROUP BY DATE(date_test) ORDER BY date DESC LIMIT 30",
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

// Get all stories with filters (map DB: id_story -> id, date_pub -> date_creation, add titre fallback)
app.get("/api/admin/stories", verifyToken, (req, res) => {
  const { statut } = req.query;

  let query = "SELECT id_story AS id, COALESCE(titre, '') AS titre, contenu, statut, is_anonymous, date_pub AS date_creation, id_user FROM stories";
  const params = [];

  if (statut) {
    query += " WHERE statut = ?";
    params.push(statut);
  }

  query += " ORDER BY date_pub DESC";

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
    "UPDATE stories SET statut = ? WHERE id_story = ?",
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

  db.query("DELETE FROM stories WHERE id_story = ?", [id], (err, results) => {
    if (err) {
      console.error("Error deleting story:", err);
      return res.status(500).json({ error: "Failed to delete story" });
    }
    res.json({ message: "Story deleted successfully" });
  });
});

// ==================== TIPS ROUTES ====================

// Get all tips (alias id_tip -> id)
app.get("/api/admin/tips", verifyToken, (req, res) => {
  db.query(
    "SELECT id_tip AS id, titre, contenu, niveau, id_admin FROM tips ORDER BY id_tip DESC",
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

  db.query("SELECT id_tip AS id, titre, contenu, niveau, id_admin FROM tips WHERE id_tip = ?", [id], (err, results) => {
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
    "UPDATE tips SET titre = ?, contenu = ?, niveau = ? WHERE id_tip = ?",
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

  db.query("DELETE FROM tips WHERE id_tip = ?", [id], (err, results) => {
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
    "SELECT * FROM resources ORDER BY id_resource DESC",
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

  db.query("SELECT id_resource AS id, titre, description, lien, type, date_ajout, id_admin FROM resources WHERE id_resource = ?", [id], (err, results) => {
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
    "UPDATE resources SET titre = ?, description = ?, lien = ?, type = ? WHERE id_resource = ?",
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

  db.query("DELETE FROM resources WHERE id_resource = ?", [id], (err, results) => {
    if (err) {
      console.error("Error deleting resource:", err);
      return res.status(500).json({ error: "Failed to delete resource" });
    }
    res.json({ message: "Resource deleted successfully" });
  });
});

// ==================== CHALLENGES ROUTES ====================

// Get all challenges (alias id_challenge -> id)
app.get("/api/admin/challenges", verifyToken, (req, res) => {
  db.query(
    "SELECT id_challenge AS id, titre, description, niveau, duree FROM challenges ORDER BY id_challenge DESC",
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

  db.query("SELECT id_challenge AS id, titre, description, niveau, duree FROM challenges WHERE id_challenge = ?", [id], (err, results) => {
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
    "UPDATE challenges SET titre = ?, description = ?, niveau = ?, duree = ? WHERE id_challenge = ?",
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

  db.query("DELETE FROM challenges WHERE id_challenge = ?", [id], (err, results) => {
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

// Start server (configurable via PORT environment variable)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Migrate admin passwords to bcrypt (run once)
// import bcrypt from 'bcryptjs';
// import { db } from '../config/db.js'; // adjust path if needed

// db.query('SELECT id_admin, mot_de_passe FROM admin', (err, rows) => {
//   if (err) return console.error(err);
//   rows.forEach(row => {
//     const pass = row.mot_de_passe || '';
//     if (!pass.startsWith('$2')) { // naive check: not hashed
//       const hash = bcrypt.hashSync(pass, 10);
//       db.query('UPDATE admin SET mot_de_passe = ? WHERE id_admin = ?', [hash, row.id_admin], (err2) => {
//         if (err2) console.error('Failed to update admin', row.id_admin, err2);
//         else console.log('Hashed admin', row.id_admin);
//       });
//     }
//   });
// });