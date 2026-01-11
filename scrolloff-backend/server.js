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

// Parse JSON bodies (small limit) and ensure strict JSON parsing
app.use(express.json({ limit: '100kb', strict: true }));

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} Content-Type: ${req.headers['content-type']}`);
  next();
});

// Handle JSON parse errors from body-parser and return JSON error (instead of HTML stack)
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    console.error('JSON parse error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// Temporary logger for auth routes to help debug 404s
app.use('/api/auth', (req, res, next) => {
  console.log('[AUTH REQUEST]', req.method, req.path, 'Content-Type:', req.headers['content-type']);
  // Avoid logging bodies for large or binary requests, but log for debugging here
  try { console.log('[AUTH REQUEST BODY]', req.body); } catch (e) { console.log('Body log error', e.message); }
  next();
});

// Test MySQL connection and initialize tables if needed
db.query("SELECT 1", (err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ MySQL connected successfully");
    // Initialize tables if they don't exist
    initializeTables();
  }
});

// Global process-level handlers to catch unexpected errors and log them (helps debug crashes)
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason && reason.stack ? reason.stack : reason);
});

// Initialize database tables
function initializeTables() {
  // Create resources table if it doesn't exist
  const createResourcesTable = `
  CREATE TABLE IF NOT EXISTS resources (
    id_resource INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    lien VARCHAR(500) NOT NULL,
    type ENUM('Article', 'Video', 'Poster', 'External link') NOT NULL DEFAULT 'Article',
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_admin INT,
    FOREIGN KEY (id_admin) REFERENCES admin(id_admin) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

  // Create stories table if it doesn't exist
  const createStoriesTable = `
    CREATE TABLE IF NOT EXISTS stories (
      id_story INT AUTO_INCREMENT PRIMARY KEY,
      titre VARCHAR(255),
      contenu TEXT NOT NULL,
      statut ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      is_anonymous BOOLEAN DEFAULT FALSE,
      date_pub TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      id_user INT,
      FOREIGN KEY (id_user) REFERENCES utilisateur(id_user) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  db.query(createResourcesTable, (err) => {
    if (err) {
      // Ignore error if table already exists or foreign key constraint fails (parent table might not exist yet)
      if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_CANNOT_ADD_FOREIGN') {
        console.error('Warning: Could not create resources table:', err.message);
      }
    } else {
      console.log('✅ Resources table initialized');
    }
  });

  db.query(createStoriesTable, (err) => {
    if (err) {
      // Ignore error if table already exists or foreign key constraint fails (parent table might not exist yet)
      if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_CANNOT_ADD_FOREIGN') {
        console.error('Warning: Could not create stories table:', err.message);
      }
    } else {
      console.log('✅ Stories table initialized');
    }
  });
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "scrolloff-secret-key-change-in-production";
console.info('[JWT] JWT_SECRET loaded from env:', !!process.env.JWT_SECRET);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    console.debug('[verifyToken] start - url:', req.originalUrl);

    const authHeader = req.headers && (req.headers.authorization || req.headers['x-access-token']);

    if (!authHeader) {
      console.warn('[verifyToken] missing Authorization header - url:', req.originalUrl);
      return res.status(401).json({ error: "No token provided", type: 'auth', url: req.originalUrl });
    }

    // Support both "Bearer <token>" and raw token strings
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token || token === 'null' || token === 'undefined') {
      console.warn('[verifyToken] token empty or invalid string:', token, 'url:', req.originalUrl);
      return res.status(401).json({ error: "No token provided", type: 'auth', url: req.originalUrl });
    }

    let decoded;

    // Decode without verification to inspect exp/iat for debugging (safe - does not validate signature)
    try {
      const decodedUnsafe = jwt.decode(token);
      if (decodedUnsafe) {
        const exp = decodedUnsafe.exp;
        const iat = decodedUnsafe.iat;
        console.info('[verifyToken] token decode -> iat:', iat, 'exp:', exp, 'expDate:', exp ? new Date(exp * 1000).toISOString() : 'n/a', 'serverNow:', new Date().toISOString(), 'url:', req.originalUrl);
      } else {
        console.debug('[verifyToken] token decode returned null', 'url:', req.originalUrl);
      }
    } catch (e) {
      console.debug('[verifyToken] token decode error:', e && e.message ? e.message : e, 'url:', req.originalUrl);
    }

    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.info('[verifyToken] token valid for adminId:', decoded && decoded.id, 'url:', req.originalUrl);
    } catch (err) {
      // If token is expired, return a clear 401
      if (err && err.name === 'TokenExpiredError') {
        // Also attempt to show decoded exp for extra context
        const decodedUnsafe = jwt.decode(token) || {};
        const exp = decodedUnsafe.exp;
        console.warn('[verifyToken] token expired -> exp:', exp, 'expDate:', exp ? new Date(exp * 1000).toISOString() : 'n/a', 'serverNow:', new Date().toISOString(), 'url:', req.originalUrl);
        return res.status(401).json({ error: "Token expired or invalid" });
      }
      console.debug('[verifyToken] JWT verification failed:', (err && err.message) || err, 'url:', req.originalUrl);
      return res.status(401).json({ error: "Token expired or invalid" });
    }

    req.adminId = decoded.id;
    console.info('[verifyToken] success for adminId:', req.adminId, 'url:', req.originalUrl);
    next();
  } catch (err) {
    console.error('[verifyToken] unexpected error:', err && err.stack ? err.stack : err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ==================== AUTH ROUTES ====================

// Quick ping to check auth route availability
app.get('/api/auth/ping', (req, res) => res.json({ ok: true }));

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

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

        if (!results || results.length === 0) {
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
          { expiresIn: "30d" }
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

// ==================== USER SIGN UP ====================
app.post("/api/auth/register", async (req, res) => {
  const { nom, email, password } = req.body;

  if (!nom || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if email exists
    db.query(
      "SELECT * FROM utilisateur WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length > 0) {
          return res.status(409).json({ error: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO utilisateur (nom, email, mot_de_passe, date_inscription) VALUES (?, ?, ?, NOW())",
          [nom, email, hashedPassword],
          (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to register" });

            res.status(201).json({
              message: "User registered successfully",
              id: result.insertId
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== USER LOGIN ====================
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  db.query(
    "SELECT * FROM utilisateur WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = results[0];
      const isValid = await bcrypt.compare(password, user.mot_de_passe);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id_user, email: user.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.json({
        token,
        user: {
          id: user.id_user,
          nom: user.nom,
          email: user.email
        }
      });
    }
  );
});



// ==================== STATISTICS ====================

// Dashboard Stats
app.get("/api/admin/stats", verifyToken, (req, res) => {
  const stats = {};

  // Total users (table `utilisateur` in DB)
  db.query("SELECT COUNT(*) as total FROM utilisateur", (err, results) => {
    if (err) {
      console.error("Error getting users count:", err);
      stats.totalUsers = 0;
    } else {
      stats.totalUsers = results[0].total;
    }

    // Total tests (table `resultat` in DB)
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

// ==================== ADMIN MANAGEMENT ROUTES ====================

// Get all admins
app.get("/api/admin/admins", verifyToken, (req, res) => {
  db.query(
    "SELECT id_admin AS id, username FROM admin ORDER BY id_admin DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching admins:", err);
        return res.status(500).json({ error: "Failed to fetch admins" });
      }
      res.json(results);
    }
  );
});

// Create new admin
app.post("/api/admin/admins", verifyToken, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO admin (username, mot_de_passe) VALUES (?, ?)",
      [username, hashedPassword],
      (err, results) => {
        if (err) {
          console.error("Error creating admin:", err);
          return res.status(500).json({ error: "Failed to create admin" });
        }
        res.json({ id: results.insertId, message: "Admin created successfully" });
      }
    );
  } catch (error) {
    console.error("Error hashing password:", error);
    return res.status(500).json({ error: "Failed to create admin" });
  }
});

// ==================== USERS ROUTES ====================

// Get all users (map `utilisateur` fields to API contract)
app.get("/api/admin/users", verifyToken, (req, res) => {
  // Note: the `utilisateur` table does not have an `is_active` column in the current schema.
  // Return a default `is_active` = 1 so frontend UI can render status without error.
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

// Update user status (enable/disable) - operates on `utilisateur`
app.patch("/api/admin/users/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  // The `utilisateur` table may not have `is_active` column in the current schema.
  // Check for the column first; if it's missing, return success but do not attempt to update
  // (prevents SQL errors and keeps server stable). Recommend adding `is_active` column
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

  // Total tests (table `resultat`)
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

// Get all stories with filters (map DB: id_story -> id, date_pub -> date_creation; compute titre fallback server-side)
app.get("/api/admin/stories", verifyToken, (req, res) => {
  const { statut } = req.query;
  console.log('[ROUTE] GET /api/admin/stories - entered, statut =', statut);

  // Match DB schema exactly (no `titre` column in stories)
  let query = "SELECT id_story AS id, contenu, statut, is_anonymous, date_pub AS date_creation, id_user, id_admin FROM stories";
  const params = [];

  if (statut) {
    query += " WHERE statut = ?";
    params.push(statut);
  }

  query += " ORDER BY date_pub DESC";

  try {
    db.query(query, params, (err, results) => {
      if (err) {
        // More explicit SQL error logging
        console.error("SQL ERROR fetching stories:", err, { code: err && err.code, sqlMessage: err && err.sqlMessage });
        // Check if table doesn't exist
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({ 
            error: "Stories table does not exist. Please run the database initialization script.",
            type: 'sql',
            code: err.code
          });
        }
        return res.status(500).json({ error: "Failed to fetch stories", details: err && (err.message || err.sqlMessage), code: err && err.code });
      }

      try {
        const mapped = (results || []).map(r => ({
          id: r.id,
          contenu: r.contenu,
          statut: r.statut,
          is_anonymous: !!r.is_anonymous,
          date_creation: r.date_creation || r.date_pub,
          id_user: r.id_user,
          id_admin: r.id_admin,
          // No `titre` column in DB: provide a safe fallback for client display
          titre: r.titre || (r.contenu ? (r.contenu.length > 80 ? r.contenu.slice(0,80) + '...' : r.contenu) : '')
        }));

        console.log('[ROUTE] GET /api/admin/stories - fetched, count =', mapped.length);
        return res.json(mapped);
      } catch (serializationError) {
        console.error("Error serializing stories response:", serializationError);
        return res.status(200).json([]);
      }
    });
  } catch (outerErr) {
    console.error('[ROUTE] GET /api/admin/stories - unexpected error before db.query:', outerErr);
    return res.status(500).json({ error: "Server error when fetching stories" });
  }
});

console.log('Registered route: GET /api/admin/stories');

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
    "SELECT id_resource AS id, titre, description, lien, `type` AS type, date_ajout, id_admin FROM resources ORDER BY id_resource DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching resources:", err);
        console.error("SQL Error details:", err.message);
        // Check if table doesn't exist
        if (err.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({ 
            error: "Resources table does not exist. Please run the database initialization script." 
          });
        }
        return res.status(500).json({ error: "Failed to fetch resources: " + err.message });
      }
      try {
        // Log result size for debugging
        console.log("Resources fetched, count:", Array.isArray(results) ? results.length : 0);
        return res.status(200).json(Array.isArray(results) ? results : []);
      } catch (serializationError) {
        console.error("Error serializing resources response:", serializationError);
        // Fallback: return an empty array so the frontend still receives a valid JSON
        return res.status(200).json([]);
      }
    }
  );
});

// Get resource by ID
app.get("/api/admin/resources/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  db.query("SELECT id_resource AS id, titre, description, lien, `type` AS type, date_ajout, id_admin FROM resources WHERE id_resource = ?", [id], (err, results) => {
    if (err) {
      console.error("Error fetching resource:", err);
      return res.status(500).json({ error: "Failed to fetch resource" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Resource not found" });
    }
    try {
      return res.status(200).json(results[0]);
    } catch (serializationError) {
      console.error("Error serializing resource response:", serializationError);
      return res.status(200).json({});
    }
  });
});

// Create resource
app.post("/api/admin/resources", verifyToken, (req, res) => {
  const { titre, description, lien, type } = req.body;

  if (!titre || !description || !lien || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "INSERT INTO resources (titre, description, lien, `type`) VALUES (?, ?, ?, ?)",
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
    "UPDATE resources SET titre = ?, description = ?, lien = ?, `type` = ? WHERE id_resource = ?",
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

// Get all challenges (public endpoint - no authentication required)
app.get("/api/challenges", (req, res) => {
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

// Get all challenges (admin endpoint - alias id_challenge -> id)
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
app.get('/', (req, res) => res.send('API ScrollOff is working 😎 (MySQL only)'));

// JSON 404 handler for all unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
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
