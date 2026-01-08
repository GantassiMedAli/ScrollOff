// Database initialization script
// Run this once to create the necessary tables if they don't exist

import { db } from './config/db.js';

const createTables = () => {
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
      console.error('Error creating resources table:', err);
    } else {
      console.log('✅ Resources table created/verified');
    }
  });

  db.query(createStoriesTable, (err) => {
    if (err) {
      console.error('Error creating stories table:', err);
    } else {
      console.log('✅ Stories table created/verified');
    }
  });
};

// Test connection and create tables
db.query('SELECT 1', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  } else {
    console.log('✅ Database connected');
    createTables();
    setTimeout(() => {
      console.log('Database initialization complete');
      process.exit(0);
    }, 1000);
  }
});

