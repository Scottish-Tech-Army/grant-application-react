const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun, saveDb, lastInsertId } = require('../db/setup');

// GET /api/field-groups — all groups with field count
router.get('/', (req, res) => {
  try {
    const groups = dbAll(`
      SELECT
        fg.*,
        COUNT(cf.id) as field_count
      FROM field_groups fg
      LEFT JOIN common_fields cf ON cf.group_id = fg.id
      GROUP BY fg.id
      ORDER BY fg.id ASC
    `);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/field-groups
router.post('/', (req, res) => {
  try {
    const { name, description = null, color = '#6366f1' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

    dbRun('INSERT INTO field_groups (name, description, color) VALUES (?, ?, ?)', [name.trim(), description, color]);
    saveDb();
    const id = lastInsertId();
    const created = dbGet('SELECT * FROM field_groups WHERE id = ?', [id]);
    res.status(201).json({ ...created, field_count: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/field-groups/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = dbGet('SELECT * FROM field_groups WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Group not found' });

    const { name, description, color } = req.body;
    const updName  = name        !== undefined ? name.trim()   : existing.name;
    const updDesc  = description !== undefined ? description   : existing.description;
    const updColor = color       !== undefined ? color         : existing.color;

    dbRun('UPDATE field_groups SET name = ?, description = ?, color = ? WHERE id = ?',
      [updName, updDesc, updColor, id]);
    saveDb();

    const updated = dbGet('SELECT * FROM field_groups WHERE id = ?', [id]);
    const fieldCount = dbGet('SELECT COUNT(*) as cnt FROM common_fields WHERE group_id = ?', [id]);
    res.json({ ...updated, field_count: fieldCount ? fieldCount.cnt : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/field-groups/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = dbGet('SELECT * FROM field_groups WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Group not found' });

    dbRun('DELETE FROM field_groups WHERE id = ?', [id]);
    saveDb();
    res.json({ message: 'Deleted', id: Number(id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
