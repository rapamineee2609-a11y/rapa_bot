import { Logger } from '../core/logger.js';
import { Database } from '../core/database.js';
import { Bot } from '../core/bot.js';
import { Config } from '../core/config.js';
import { GroupParticipantsUpdate, WASocket } from '@whiskeysockets/baileys';

export class EventHandler {
  private static instance: EventHandler;
  private logger: Logger;
  private db: Database;
  private config: Config;

  private constructor() {
    this.logger = Logger.getInstance();
    this.db = Database.getInstance();
    this.config = Config.getInstance();
  }

  public static getInstance(): EventHandler {
    if (!EventHandler.instance) {
      EventHandler.instance = new EventHandler();
    }
    return EventHandler.instance;
  }

  public async handlePresence(update: any): Promise<void> {
    // Handle presence updates
    // Future implementation for advanced features
  }

  public async handleGroupParticipants(
    update: GroupParticipantsUpdate,
    socket: WASocket
  ): Promise<void> {
    try {
      const { id, participants, action } = update;
      const bot = Bot.getInstance();

      if (action === 'add') {
        for (const participant of participants) {
          if (participant === socket.user?.id) continue;
          this.logger.info(`👤 New member joined ${id}: ${participant}`);

          if (this.config.get('WELCOME_ENABLED')) {
            const welcomeText = `👋 Welcome to the group!\n\nHey @${participant.split('@')[0]}, welcome! Enjoy your stay and follow the rules.`;
            await bot.sendText(id, welcomeText);
          }
        }
      } else if (action === 'remove') {
        for (const participant of participants) {
          if (participant === socket.user?.id) continue;
          this.logger.info(`👋 Member left ${id}: ${participant}`);
        }
      } else if (action === 'promote') {
        this.logger.info(`⬆️ Member promoted in ${id}: ${participants.join(', ')}`);
      } else if (action === 'demote') {
        this.logger.info(`⬇️ Member demoted in ${id}: ${participants.join(', ')}`);
      }
    } catch (error) {
      this.logger.error('❌ Error handling group event:', error);
    }
  }
}
