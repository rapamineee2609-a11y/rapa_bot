import cron from 'node-cron';
import { Logger } from '../core/logger.js';
import { Database } from '../core/database.js';
import { Config } from '../core/config.js';
import fs from 'fs-extra';
import path from 'path';

export class Scheduler {
  private static instance: Scheduler;
  private logger: Logger;
  private db: Database;
  private config: Config;
  private tasks: cron.ScheduledTask[] = [];

  private constructor() {
    this.logger = Logger.getInstance();
    this.db = Database.getInstance();
    this.config = Config.getInstance();
  }

  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  public start(): void {
    this.logger.info('⏰ Starting scheduler...');

    // Auto backup every 6 hours
    if (this.config.get('AUTO_BACKUP')) {
      const backupTask = cron.schedule('0 */6 * * *', () => {
        this.logger.info('📦 Running scheduled backup...');
        try {
          this.db.backup();
        } catch (error) {
          this.logger.error('❌ Backup failed:', error);
        }
      });
      this.tasks.push(backupTask);
    }

    // Cleanup logs daily
    const cleanupTask = cron.schedule('0 3 * * *', () => {
      this.logger.info('🧹 Running cleanup...');
      this.cleanupLogs();
    });
    this.tasks.push(cleanupTask);

    // Memory check every 5 minutes
    const memoryTask = cron.schedule('*/5 * * * *', () => {
      const used = process.memoryUsage();
      const maxMem = this.config.get('MAX_MEMORY') || 512;
      const usedMB = used.heapUsed / 1024 / 1024;
      if (usedMB > maxMem * 0.9) {
        this.logger.warn(`⚠️ High memory usage: ${usedMB.toFixed(2)}MB / ${maxMem}MB`);
      }
    });
    this.tasks.push(memoryTask);

    this.logger.info(`✅ Scheduled ${this.tasks.length} tasks`);
  }

  private cleanupLogs(): void {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) return;

    const files = fs.readdirSync(logDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile() && now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        this.logger.debug(`🗑️ Deleted old log: ${file}`);
      }
    }
  }

  public stop(): void {
    for (const task of this.tasks) {
      task.stop();
    }
    this.tasks = [];
    this.logger.info('⏰ Scheduler stopped');
  }

  public addTask(schedule: string, callback: () => void): cron.ScheduledTask {
    const task = cron.schedule(schedule, callback);
    this.tasks.push(task);
    return task;
  }
}
