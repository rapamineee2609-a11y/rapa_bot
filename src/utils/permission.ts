import { Database } from '../core/database.js';
import { Config } from '../core/config.js';
import { WASocket } from '@whiskeysockets/baileys';

export class Permission {
  private static instance: Permission;
  private db: Database;
  private config: Config;

  private constructor() {
    this.db = Database.getInstance();
    this.config = Config.getInstance();
  }

  public static getInstance(): Permission {
    if (!Permission.instance) {
      Permission.instance = new Permission();
    }
    return Permission.instance;
  }

  public isOwner(number: string): boolean {
    const owner = this.config.get('OWNER_NUMBER');
    if (!owner) return false;
    const cleanNumber = number.replace(/[^0-9]/g, '');
    const cleanOwner = owner.replace(/[^0-9]/g, '');
    return cleanNumber === cleanOwner;
  }

  public check(user: string, required: 'user' | 'admin' | 'owner', isOwner: boolean): boolean {
    if (required === 'owner') return isOwner;
    if (required === 'admin') return isOwner || this.isGroupAdmin(user);
    return true;
  }

  public async isGroupAdmin(socket: WASocket, groupId: string, user: string): Promise<boolean> {
    try {
      const metadata = await socket.groupMetadata(groupId);
      const participant = metadata.participants.find(
        (p: any) => p.id === user
      );
      return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
      return false;
    }
  }

  public async isBotAdmin(socket: WASocket, groupId: string): Promise<boolean> {
    try {
      const metadata = await socket.groupMetadata(groupId);
      const botId = socket.user?.id;
      if (!botId) return false;
      const participant = metadata.participants.find(
        (p: any) => p.id === botId
      );
      return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
      return false;
    }
  }

  private isGroupAdmin(user: string): boolean {
    // This is a fallback, actual check is done via socket
    return false;
  }

  public getUserRole(number: string): string {
    if (this.isOwner(number)) return 'owner';
    try {
      const stmt = this.db.getDb().prepare(`SELECT role FROM users WHERE number = ?`);
      const result = stmt.get(number);
      return result?.role || 'user';
    } catch {
      return 'user';
    }
  }

  public async setUserRole(number: string, role: 'user' | 'admin' | 'owner'): Promise<void> {
    const stmt = this.db.getDb().prepare(
      `INSERT OR REPLACE INTO users (number, role, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`
    );
    stmt.run(number, role);
  }
}
