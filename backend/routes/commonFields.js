const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun, saveDb, lastInsertId } = require('../db/setup');

// GET /api/common-fields
router.get('/', (req, res) => {
  try {
    const { group_id, search } = req.query;

    let sql = `
      SELECT cf.*, fg.name AS group_name, fg.color AS group_color
      FROM common_fields cf
      LEFT JOIN field_groups fg ON fg.id = cf.group_id
      WHERE 1=1
    `;
    const params = [];
    if (group_id) { sql += ' AND cf.group_id = ?'; params.push(group_id); }
    if (search)   { sql += ' AND LOWER(cf.label) LIKE LOWER(?)'; params.push(`%${search}%`); }
    sql += ' ORDER BY cf.group_id ASC, cf.id ASC';

    res.json(dbAll(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/common-fields/:id
router.get('/:id', (req, res) => {
  try {
    const field = dbGet(`
      SELECT cf.*, fg.name AS group_name, fg.color AS group_color
      FROM common_fields cf
      LEFT JOIN field_groups fg ON fg.id = cf.group_id
      WHERE cf.id = ?
    `, [req.params.id]);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    const versions = dbAll(
      'SELECT * FROM common_field_versions WHERE field_id = ? ORDER BY id DESC',
      [req.params.id]
    );
    res.json({ ...field, versions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/common-fields
router.post('/', (req, res) => {
  try {
    const { group_id = null, label, value = '', hint = '' } = req.body;
    if (!label || !label.trim()) return res.status(400).json({ error: 'label is required' });

    dbRun('INSERT INTO common_fields (group_id, label, value, hint) VALUES (?, ?, ?, ?)',
      [group_id, label.trim(), value, hint]);
    const fieldId = lastInsertId();
    dbRun('INSERT INTO common_field_versions (field_id, value) VALUES (?, ?)', [fieldId, value]);
    saveDb();

    const created = dbGet(`
      SELECT cf.*, fg.name AS group_name, fg.color AS group_color
      FROM common_fields cf LEFT JOIN field_groups fg ON fg.id = cf.group_id
      WHERE cf.id = ?
    `, [fieldId]);
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/common-fields/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = dbGet('SELECT * FROM common_fields WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Field not found' });

    const { label, value, hint, group_id } = req.body;
    const updLabel   = label    !== undefined ? label.trim() : existing.label;
    const updValue   = value    !== undefined ? value        : existing.value;
    const updHint    = hint     !== undefined ? hint         : existing.hint;
    const updGroupId = group_id !== undefined ? group_id     : existing.group_id;

    dbRun(`UPDATE common_fields SET label=?, value=?, hint=?, group_id=?, updated_at=datetime('now') WHERE id=?`,
      [updLabel, updValue, updHint, updGroupId, id]);

    if (value !== undefined && value !== existing.value) {
      dbRun('INSERT INTO common_field_versions (field_id, value) VALUES (?, ?)', [id, updValue]);
    }
    saveDb();

    const updated = dbGet(`
      SELECT cf.*, fg.name AS group_name, fg.color AS group_color
      FROM common_fields cf LEFT JOIN field_groups fg ON fg.id = cf.group_id
      WHERE cf.id = ?
    `, [id]);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/common-fields/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!dbGet('SELECT id FROM common_fields WHERE id = ?', [id]))
      return res.status(404).json({ error: 'Field not found' });

    dbRun('DELETE FROM common_field_versions WHERE field_id = ?', [id]);
    dbRun('DELETE FROM common_fields WHERE id = ?', [id]);
    saveDb();
    res.json({ message: 'Deleted', id: Number(id) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
