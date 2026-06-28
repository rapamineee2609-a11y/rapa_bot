import dotenv from 'dotenv';
import { Bot } from './core/bot.js';
import { Logger } from './core/logger.js';
import { Config } from './core/config.js';
import { Database } from './core/database.js';
import { SessionManager } from './core/session.js';
import { CacheManager } from './core/cache.js';
import { CommandHandler } from './handlers/commandHandler.js';
import { MessageHandler } from './handlers/messageHandler.js';
import { EventHandler } from './handlers/eventHandler.js';
import { PluginHandler } from './handlers/pluginHandler.js';
import { Scheduler } from './utils/scheduler.js';

dotenv.config();

async function main() {
  const logger = Logger.getInstance();
  const config = Config.getInstance();

  logger.info('🚀 Starting WhatsApp Bot AI Professional...');
  logger.info(`📦 Version: ${config.get('BOT_NAME')} v3.0.0`);

  try {
    // Init Database
    const db = Database.getInstance();
    await db.initialize();

    // Init Cache
    const cache = CacheManager.getInstance();

    // Init Session
    const session = SessionManager.getInstance();

    // Init Handlers
    const commandHandler = CommandHandler.getInstance();
    const messageHandler = MessageHandler.getInstance();
    const eventHandler = EventHandler.getInstance();
    const pluginHandler = PluginHandler.getInstance();

    // Load plugins
    await pluginHandler.loadAll();

    // Init Bot
    const bot = Bot.getInstance();
    await bot.start();

    // Start Scheduler
    const scheduler = Scheduler.getInstance();
    scheduler.start();

    logger.info('✅ Bot started successfully!');
    logger.info(`📱 Connected as: ${bot.getBotName()}`);
    logger.info(`🔗 Session: ${config.get('SESSION_ID')}`);
  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  const logger = Logger.getInstance();
  logger.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  const logger = Logger.getInstance();
  logger.error('💥 Unhandled Rejection:', reason);
});

main();
