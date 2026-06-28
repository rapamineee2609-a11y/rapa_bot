import { Buffer } from 'buffer';
import path from 'path';
import fs from 'fs-extra';
import { Logger } from './logger.js';
import { Config } from './config.js';

export class SessionManager {
  private static instance: SessionManager;
  private logger: Logger;
  private config: Config;
  private sessionDir: string;

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = Config.getInstance();
    this.sessionDir = path.join(process.cwd(), 'sessions');
    fs.ensureDirSync(this.sessionDir);
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public getSessionPath(): string {
    const sessionId = this.config.get('SESSION_ID') || 'default';
    return path.join(this.sessionDir, `${sessionId}.json`);
  }

  public async loadSession(): Promise<any> {
    const sessionPath = this.getSessionPath();
    if (fs.existsSync(sessionPath)) {
      try {
        const data = fs.readJsonSync(sessionPath);
        this.logger.info('🔐 Session loaded successfully');
        return data;
      } catch (error) {
        this.logger.warn('⚠️ Failed to load session, starting fresh');
        return null;
      }
    }
    return null;
  }

  public async saveSession(sessionData: any): Promise<void> {
    const sessionPath = this.getSessionPath();
    try {
      fs.writeJsonSync(sessionPath, sessionData, { spaces: 2 });
      this.logger.info('💾 Session saved successfully');
    } catch (error) {
      this.logger.error('❌ Failed to save session:', error);
    }
  }

  public async clearSession(): Promise<void> {
    const sessionPath = this.getSessionPath();
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
      this.logger.info('🗑️ Session cleared');
    }
  }
}
