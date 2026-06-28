import { WASocket, WAMessage, proto } from '@whiskeysockets/baileys';
import { Logger } from '../core/logger.js';
import { Config } from '../core/config.js';
import { Database } from '../core/database.js';
import { CacheManager } from '../core/cache.js';
import { CommandHandler } from './commandHandler.js';
import { Bot } from '../core/bot.js';
import { Permission } from '../utils/permission.js';

export class MessageHandler {
  private static instance: MessageHandler;
  private logger: Logger;
  private config: Config;
  private db: Database;
  private cache: CacheManager;
  private commandHandler: CommandHandler;
  private permission: Permission;

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = Config.getInstance();
    this.db = Database.getInstance();
    this.cache = CacheManager.getInstance();
    this.commandHandler = CommandHandler.getInstance();
    this.permission = Permission.getInstance();
  }

  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  public async handle(msg: WAMessage, socket: WASocket): Promise<void> {
    try {
      const bot = Bot.getInstance();
      const message = msg.message;
      if (!message) return;

      const from = msg.key.remoteJid!;
      const sender = msg.key.participant || from;
      const isGroup = from.endsWith('@g.us');
      const groupId = isGroup ? from : undefined;

      // Skip if from me
      if (msg.key.fromMe) return;

      // Get message text
      let text = '';
      if (message.conversation) {
        text = message.conversation;
      } else if (message.extendedTextMessage?.text) {
        text = message.extendedTextMessage.text;
      } else if (message.imageMessage?.caption) {
        text = message.imageMessage.caption;
      } else if (message.videoMessage?.caption) {
        text = message.videoMessage.caption;
      } else if (message.documentMessage?.caption) {
        text = message.documentMessage.caption;
      }

      if (!text) return;

      // Check prefix
      const prefix = this.config.get('PREFIX');
      if (!text.startsWith(prefix)) return;

      // Parse command
      const [fullCmd, ...args] = text.slice(prefix.length).trim().split(/\s+/);
      const commandName = fullCmd.toLowerCase();

      // Get sender info
      const senderNumber = sender.split('@')[0];
      const isOwner = this.permission.isOwner(senderNumber);
      const isAdmin = isGroup ? await this.permission.isGroupAdmin(socket, from, sender) : false;
      const isBotAdmin = isGroup ? await this.permission.isBotAdmin(socket, from) : false;

      // Execute command
      const params = {
        bot,
        socket,
        msg,
        args,
        from,
        sender,
        isGroup,
        groupId,
        isOwner,
        isAdmin,
        isBotAdmin,
        command: commandName,
        prefix,
      };

      await this.commandHandler.execute(commandName, params);

      // Auto-read
      if (this.config.get('AUTO_READ')) {
        await socket.readMessages([msg.key]);
      }
    } catch (error) {
      this.logger.error('❌ Error handling message:', error);
    }
  }
}
