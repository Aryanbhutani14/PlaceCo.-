const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../data/placeco.db');
const dbDir = path.dirname(path.resolve(dbPath));

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

function getDb(customPath = null) {
  if (db && !customPath) return db;

  const targetPath = customPath || dbPath;
  const instance = new Database(targetPath);
  instance.pragma('foreign_keys = ON');

  // Initialize schema if not present
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    instance.exec(schema);
  }

  if (!customPath) {
    db = instance;
    return db;
  }
  return instance;
}

module.exports = {
  getDb,
  db: getDb()
};
