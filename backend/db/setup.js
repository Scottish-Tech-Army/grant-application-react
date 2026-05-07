// db/setup.js — SQLite via sql.js (pure WebAssembly, no native bindings required)
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db = null;

// ─── Persistence ──────────────────────────────────────────────────────────────
function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ─── Query helpers ────────────────────────────────────────────────────────────
function dbRun(sql, params = []) {
  db.run(sql, params);
}

function dbRunSave(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function dbAll(sql, params = []) {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push({ ...stmt.getAsObject() });
  }
  stmt.free();
  return results;
}

function lastInsertId() {
  const row = dbGet('SELECT last_insert_rowid() as id');
  return row ? row.id : null;
}

function runTransaction(fn) {
  db.run('BEGIN');
  try {
    const result = fn();
    db.run('COMMIT');
    saveDb();
    return result;
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

// ─── Schema ───────────────────────────────────────────────────────────────────
function setupTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS field_groups (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      color       TEXT DEFAULT '#6366f1',
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS common_fields (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id   INTEGER,
      label      TEXT NOT NULL,
      value      TEXT DEFAULT '',
      hint       TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS common_field_versions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      field_id   INTEGER,
      value      TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      funder_name TEXT,
      status      TEXT DEFAULT 'draft',
      notes       TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS application_common_fields (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      field_id       INTEGER,
      UNIQUE(application_id, field_id)
    );

    CREATE TABLE IF NOT EXISTS application_custom_fields (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      label          TEXT NOT NULL,
      answer         TEXT DEFAULT '',
      sort_order     INTEGER DEFAULT 0,
      created_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TEXT DEFAULT (datetime('now'))
    );
  `);
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
function seedData() {
  const existing = dbGet('SELECT COUNT(*) as cnt FROM field_groups');
  if (existing && existing.cnt > 0) return;

  function insertGroup(name, description, color) {
    dbRun('INSERT INTO field_groups (name, description, color) VALUES (?, ?, ?)', [name, description, color]);
    return lastInsertId();
  }

  const g1 = insertGroup('Organisational Info', null, '#3b82f6');
  const g2 = insertGroup('Mission & Impact', null, '#8b5cf6');
  const g3 = insertGroup('Financial Information', null, '#10b981');
  const g4 = insertGroup('Project Details', null, '#f59e0b');
  const g5 = insertGroup('Team & Governance', null, '#ef4444');

  function insertField(groupId, label, value, hint) {
    dbRun(
      'INSERT INTO common_fields (group_id, label, value, hint) VALUES (?, ?, ?, ?)',
      [groupId, label, value, hint || '']
    );
    const fieldId = lastInsertId();
    dbRun('INSERT INTO common_field_versions (field_id, value) VALUES (?, ?)', [fieldId, value]);
    return fieldId;
  }

  const fOrgName   = insertField(g1, 'Organisation Name', 'The Futures Group');
  const fCharityNo = insertField(g1, 'Registered Charity Number', '1234567');
  const fAddress   = insertField(g1, 'Organisation Address', '123 Community Lane, Bristol, BS1 2AB');
  const fWebsite   = insertField(g1, 'Website URL', 'www.thefuturesgroup.org.uk');
  const fYear      = insertField(g1, 'Year Established', '2010');

  const fMission  = insertField(g2, 'Mission Statement',
    'We exist to empower disadvantaged young people in Bristol through education, mentorship, and community support programmes that unlock their potential.');
  const fBenef    = insertField(g2, 'Key Beneficiaries',
    'Young people aged 14-25 from low-income backgrounds in the Bristol area');
  const fGeo      = insertField(g2, 'Geographic Area of Work',
    'Bristol and surrounding areas of South West England');
  const fNumBenef = insertField(g2, 'Number of Beneficiaries (per year)',
    'Over 500 young people annually');

  insertField(g3, 'Annual Income', '£320,000');
  insertField(g3, 'Annual Expenditure', '£295,000');
  insertField(g3, 'Free Reserves', '£76,000 (approximately 3 months operating costs)');
  insertField(g3, 'Bank Name', 'NatWest');

  const fProjName  = insertField(g4, 'Project Name', 'Youth Futures Programme');
  const fProjStart = insertField(g4, 'Project Start Date', 'April 2025');
  const fProjDur   = insertField(g4, 'Project Duration', '12 months');
  const fProjCost  = insertField(g4, 'Total Project Cost', '£85,000');

  insertField(g5, 'CEO / Lead Officer', 'Dr Sarah Mitchell');
  insertField(g5, 'Number of Trustees', '7');
  insertField(g5, 'Number of Staff', '12 full-time, 5 part-time');
  insertField(g5, 'Number of Volunteers', '45 active volunteers');

  // Sample application
  dbRun(
    `INSERT INTO applications (title, funder_name, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
    ['Arts Council England – Small Grants', 'Arts Council England', 'draft',
     'Deadline is 31st March 2025. Focus on community arts outcomes.']
  );
  const appId = lastInsertId();

  const linkedIds = [fOrgName, fCharityNo, fAddress, fWebsite, fYear,
                     fMission, fBenef, fGeo, fNumBenef,
                     fProjName, fProjStart, fProjDur, fProjCost];
  for (const fid of linkedIds) {
    dbRun('INSERT OR IGNORE INTO application_common_fields (application_id, field_id) VALUES (?, ?)', [appId, fid]);
  }

  dbRun('INSERT INTO application_custom_fields (application_id, label, answer, sort_order) VALUES (?, ?, ?, ?)',
    [appId, 'How will you measure success?',
     'We will use a combination of attendance records, participant surveys, and case studies to evaluate impact against our three core KPIs.', 0]);
  dbRun('INSERT INTO application_custom_fields (application_id, label, answer, sort_order) VALUES (?, ?, ?, ?)',
    [appId, 'What makes your project unique?',
     'Our peer-led delivery model and deep community roots mean we reach young people who are often excluded from mainstream arts provision.', 1]);

  saveDb();
  console.log('[DB] Database seeded successfully.');
}

// ─── Seed default user ───────────────────────────────────────────────────────
async function seedDefaultUser() {
  const existing = dbGet('SELECT COUNT(*) as cnt FROM users');
  if (existing && existing.cnt > 0) return;

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  dbRunSave('INSERT INTO users (username, password_hash) VALUES (?, ?)', ['admin', hash]);
  console.log('[DB] Default user created (admin / admin123)');
}

// ─── Initialize ───────────────────────────────────────────────────────────────
async function initialize() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('[DB] Loaded existing database from', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('[DB] Created new in-memory database, will persist to', DB_PATH);
  }

  setupTables();
  seedData();
  await seedDefaultUser();
}

module.exports = { initialize, dbRun, dbRunSave, dbGet, dbAll, lastInsertId, runTransaction, saveDb };
