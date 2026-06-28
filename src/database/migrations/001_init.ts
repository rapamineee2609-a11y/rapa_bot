import { Database } from '../../core/database.js';

export async function up(db: Database): Promise<void> {
  const conn = db.getDb();

  // Create all tables
  conn.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT,
      welcome_enabled INTEGER DEFAULT 1,
      goodbye_enabled INTEGER DEFAULT 1,
      anti_link INTEGER DEFAULT 0,
      anti_spam INTEGER DEFAULT 1,
      mute_mode INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      number TEXT PRIMARY KEY,
      name TEXT,
      role TEXT DEFAULT 'user',
      banned INTEGER DEFAULT 0,
      cooldown TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS command_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command TEXT,
      user_number TEXT,
      group_id TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_command_usage_user ON command_usage(user_number);
    CREATE INDEX IF NOT EXISTS idx_command_usage_command ON command_usage(command);
    CREATE INDEX IF NOT EXISTS idx_command_usage_date ON command_usage(executed_at);
  `);

  // Insert default settings
  const insert = conn.prepare(`
    INSERT OR IGNORE INTO settings (key, value)
    VALUES (?, ?)
  `);

  const defaults = [
    ['bot_name', 'MyAI_Bot'],
    ['prefix', '.'],
    ['language', 'id'],
    ['menu_style', 'modern'],
    ['auto_read', '1'],
    ['anti_spam', '1'],
    ['welcome_enabled', '1'],
    ['auto_backup', '1'],
  ];

  for (const [key, value] of defaults) {
    insert.run(key, value);
  }
}

export async function down(db: Database): Promise<void> {
  const conn = db.getDb();
  conn.exec(`
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS groups;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS command_usage;
    DROP TABLE IF EXISTS backups;
  `);
}
