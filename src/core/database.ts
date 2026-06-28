import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { Logger } from './logger.js';
import { Config } from './config.js';

export class Database {
  private static instance: Database;
  private db: Database.Database;
  private logger: Logger;
  private config: Config;

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = Config.getInstance();
    const dbPath = this.config.get('DB_PATH');
    fs.ensureDirSync(path.dirname(dbPath));
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('cache_size = 10000');
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async initialize(): Promise<void> {
    this.logger.info('📂 Initializing database...');

    // Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Groups table
    this.db.exec(`
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
      )
    `);

    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        number TEXT PRIMARY KEY,
        name TEXT,
        role TEXT DEFAULT 'user',
        banned INTEGER DEFAULT 0,
        cooldown TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Commands usage
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS command_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        command TEXT,
        user_number TEXT,
        group_id TEXT,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Backup logs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Prepare statements
    this.prepareStatements();
    this.logger.success('✅ Database initialized successfully');
  }

  private prepareStatements(): void {
    // Settings
    this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    this.db.prepare(`SELECT value FROM settings WHERE key = ?`);

    // Groups
    this.db.prepare(`
      INSERT OR REPLACE INTO groups (id, name, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    this.db.prepare(`SELECT * FROM groups WHERE id = ?`);
    this.db.prepare(`UPDATE groups SET welcome_enabled = ? WHERE id = ?`);
    this.db.prepare(`UPDATE groups SET anti_link = ? WHERE id = ?`);

    // Users
    this.db.prepare(`
      INSERT OR REPLACE INTO users (number, name, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    this.db.prepare(`SELECT * FROM users WHERE number = ?`);
    this.db.prepare(`UPDATE users SET role = ? WHERE number = ?`);
    this.db.prepare(`UPDATE users SET banned = ? WHERE number = ?`);

    // Command usage
    this.db.prepare(`
      INSERT INTO command_usage (command, user_number, group_id)
      VALUES (?, ?, ?)
    `);
  }

  public getDb(): Database.Database {
    return this.db;
  }

  public close(): void {
    this.db.close();
  }

  public backup(): string {
    const backupDir = path.join(process.cwd(), 'backups');
    fs.ensureDirSync(backupDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `bot_${timestamp}.db`);
    this.db.backup(backupPath);
    this.logger.info(`📦 Database backed up to: ${backupPath}`);
    return backupPath;
  }
}
