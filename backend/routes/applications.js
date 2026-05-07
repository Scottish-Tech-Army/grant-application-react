const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun, saveDb, lastInsertId } = require('../db/setup');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFullApplication(id) {
  const app = dbGet('SELECT * FROM applications WHERE id = ?', [id]);
  if (!app) return null;

  const commonFields = dbAll(`
    SELECT cf.*, fg.name AS group_name, fg.color AS group_color
    FROM application_common_fields acf
    JOIN common_fields cf ON cf.id = acf.field_id
    LEFT JOIN field_groups fg ON fg.id = cf.group_id
    WHERE acf.application_id = ?
    ORDER BY cf.group_id ASC, cf.id ASC
  `, [id]);

  const customFields = dbAll(
    'SELECT * FROM application_custom_fields WHERE application_id = ? ORDER BY sort_order ASC, id ASC',
    [id]
  );

  return { ...app, common_fields: commonFields, custom_fields: customFields };
}

function replaceCommonFields(appId, fieldIds) {
  dbRun('DELETE FROM application_common_fields WHERE application_id = ?', [appId]);
  for (const fid of fieldIds) {
    dbRun('INSERT OR IGNORE INTO application_common_fields (application_id, field_id) VALUES (?, ?)', [appId, fid]);
  }
}

function replaceCustomFields(appId, customFields) {
  dbRun('DELETE FROM application_custom_fields WHERE application_id = ?', [appId]);
  customFields.forEach((cf, idx) => {
    dbRun(
      'INSERT INTO application_custom_fields (application_id, label, answer, sort_order) VALUES (?, ?, ?, ?)',
      [appId, cf.label, cf.answer || '', cf.sort_order !== undefined ? cf.sort_order : idx]
    );
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/applications
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT a.*,
        (SELECT COUNT(*) FROM application_common_fields WHERE application_id = a.id) AS common_field_count,
        (SELECT COUNT(*) FROM application_custom_fields WHERE application_id = a.id) AS custom_field_count
      FROM applications a WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ' AND a.status = ?'; params.push(status); }
    sql += ' ORDER BY a.updated_at DESC';
    res.json(dbAll(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/applications/:id/export  ← must come BEFORE /:id
router.get('/:id/export', (req, res) => {
  try {
    const app = getFullApplication(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const fields = [
      ...app.common_fields.map((f) => ({
        type: 'common',
        group: f.group_name || null,
        question: f.label,
        answer: f.value,
      })),
      ...app.custom_fields.map((f) => ({
        type: 'custom',
        group: null,
        question: f.label,
        answer: f.answer,
      })),
    ];

    res.json({
      id: app.id,
      title: app.title,
      funder_name: app.funder_name,
      status: app.status,
      notes: app.notes,
      created_at: app.created_at,
      updated_at: app.updated_at,
      fields,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/applications/:id
router.get('/:id', (req, res) => {
  try {
    const app = getFullApplication(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json(app);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/applications
router.post('/', (req, res) => {
  try {
    const {
      title, funder_name = null, status = 'draft', notes = '',
      common_field_ids = [], custom_fields = [],
    } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' });

    dbRun(
      `INSERT INTO applications (title, funder_name, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [title.trim(), funder_name, status, notes]
    );
    const appId = lastInsertId();
    replaceCommonFields(appId, common_field_ids);
    replaceCustomFields(appId, custom_fields);
    saveDb();

    res.status(201).json(getFullApplication(appId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/applications/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = dbGet('SELECT * FROM applications WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Application not found' });

    const { title, funder_name, status, notes, common_field_ids, custom_fields } = req.body;
    const updTitle  = title       !== undefined ? title.trim() : existing.title;
    const updFunder = funder_name !== undefined ? funder_name  : existing.funder_name;
    const updStatus = status      !== undefined ? status       : existing.status;
    const updNotes  = notes       !== undefined ? notes        : existing.notes;

    dbRun(
      `UPDATE applications SET title=?, funder_name=?, status=?, notes=?, updated_at=datetime('now') WHERE id=?`,
      [updTitle, updFunder, updStatus, updNotes, id]
    );

    if (common_field_ids !== undefined) replaceCommonFields(id, common_field_ids);
    if (custom_fields !== undefined)    replaceCustomFields(id, custom_fields);
    saveDb();

    res.json(getFullApplication(id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/applications/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!dbGet('SELECT id FROM applications WHERE id = ?', [id]))
      return res.status(404).json({ error: 'Application not found' });

    dbRun('DELETE FROM application_common_fields WHERE application_id = ?', [id]);
    dbRun('DELETE FROM application_custom_fields WHERE application_id = ?', [id]);
    dbRun('DELETE FROM applications WHERE id = ?', [id]);
    saveDb();
    res.json({ message: 'Deleted', id: Number(id) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
