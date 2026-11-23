const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "data", "quality.db"));

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    date TEXT NOT NULL,
    job_type TEXT NOT NULL,
    po TEXT NOT NULL DEFAULT '',
    job_name TEXT NOT NULL DEFAULT '',
    ss_sb TEXT NOT NULL DEFAULT '',
    grade TEXT NOT NULL DEFAULT '',
    flute TEXT NOT NULL DEFAULT '',
    size TEXT NOT NULL DEFAULT '',
    slit TEXT NOT NULL DEFAULT '',
    order_qty TEXT NOT NULL DEFAULT '',
    affected_qty TEXT NOT NULL DEFAULT '',
    production_date TEXT NOT NULL DEFAULT '',
    delivery_date TEXT NOT NULL DEFAULT '',
    problem_type TEXT NOT NULL,
    problem_detail_type TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    assignee TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL DEFAULT '',
    cs_status TEXT NOT NULL DEFAULT 'เปิดปัญหา',
    cause TEXT NOT NULL DEFAULT '',
    solution TEXT NOT NULL DEFAULT '',
    prevention TEXT NOT NULL DEFAULT '',
    resolved_date TEXT NOT NULL DEFAULT '',
    resolution_status TEXT NOT NULL DEFAULT '',
    department_id INTEGER REFERENCES departments(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_complaints_date ON complaints(date);
  CREATE INDEX IF NOT EXISTS idx_complaints_job_type ON complaints(job_type);
  CREATE INDEX IF NOT EXISTS idx_complaints_problem_type ON complaints(problem_type);

  CREATE TABLE IF NOT EXISTS complaint_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    old_value TEXT NOT NULL DEFAULT '',
    new_value TEXT NOT NULL DEFAULT '',
    changed_at TEXT NOT NULL
  );
`);

module.exports = db;