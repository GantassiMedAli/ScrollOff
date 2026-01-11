import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Health check
router.get('/ping', (req, res) => res.json({ ok: true }));

// Get approved stories (public)
router.get('/stories', (req, res) => {
  db.query(
    "SELECT id_story AS id, contenu, is_anonymous, date_pub AS date_creation FROM stories WHERE statut = 'approved' ORDER BY date_pub DESC",
    (err, results) => {
      if (err) {
        console.error('[publicRoutes] SQL error fetching stories:', err && err.message ? err.message : err);
        // Fallback sample
        return res.json([
          { id: 1, contenu: 'Sample story (fallback)', is_anonymous: true, date_creation: new Date().toISOString(), titre: 'Sample' }
        ]);
      }

      const mapped = (results || []).map(r => ({
        id: r.id,
        contenu: r.contenu,
        is_anonymous: !!r.is_anonymous,
        date_creation: r.date_creation || r.date_pub,
        titre: r.contenu ? (r.contenu.length > 80 ? r.contenu.slice(0, 80) + '...' : r.contenu) : ''
      }));
      res.json(mapped);
    }
  );
});

// Get tips (public)
router.get('/tips', (req, res) => {
  db.query(
    "SELECT id_tip AS id, titre, contenu, niveau FROM tips ORDER BY id_tip DESC",
    (err, results) => {
      if (err) {
        console.error('[publicRoutes] SQL error fetching tips:', err && err.message ? err.message : err);
        return res.json([
          { id: 1, titre: 'Take regular breaks', contenu: 'Short breaks every 50 minutes help.', niveau: 'low' }
        ]);
      }
      res.json(results || []);
    }
  );
});

// Get resources (public)
router.get('/resources', (req, res) => {
  db.query(
    "SELECT id_resource AS id, titre, description, lien, `type` AS type, date_ajout FROM resources ORDER BY id_resource DESC",
    (err, results) => {
      if (err) {
        console.error('[publicRoutes] SQL error fetching resources:', err && err.message ? err.message : err);
        return res.json([
          { id: 1, titre: 'Digital Wellbeing Starter Pack', description: 'A short guide', lien: 'https://example.com', type: 'Article', date_ajout: new Date().toISOString() }
        ]);
      }
      res.json(results || []);
    }
  );
});

console.log('Loaded publicRoutes (stories,tips,resources)');
export default router;
