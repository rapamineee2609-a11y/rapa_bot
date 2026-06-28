import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeInMemoryStore,
  WASocket,
  BufferJSON,
  MessageUpsertType,
  WAMessage,
  AnyMessageContent,
  proto,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode-terminal';
import { Logger } from './logger.js';
import { Config } from './config.js';
import { SessionManager } from './session.js';
import { Database } from './database.js';
import { MessageHandler } from '../handlers/messageHandler.js';
import { EventHandler } from '../handlers/eventHandler.js';
import { CommandHandler } from '../handlers/commandHandler.js';
import { CacheManager } from './cache.js';
import path from 'path';
import fs from 'fs-extra';
import moment from 'moment';

export class Bot {
  private static instance: Bot;
  private socket: WASocket | null = null;
  private logger: Logger;
  private config: Config;
  private session: SessionManager;
  private db: Database;
  private cache: CacheManager;
  private messageHandler: MessageHandler;
  private eventHandler: EventHandler;
  private commandHandler: CommandHandler;
  private isConnected: boolean = false;
  private startTime: Date = new Date();
  private store: any;

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = Config.getInstance();
    this.session = SessionManager.getInstance();
    this.db = Database.getInstance();
    this.cache = CacheManager.getInstance();
    this.messageHandler = MessageHandler.getInstance();
    this.eventHandler = EventHandler.getInstance();
    this.commandHandler = CommandHandler.getInstance();
    this.store = makeInMemoryStore({ logger: this.logger as any });
  }

  public static getInstance(): Bot {
    if (!Bot.instance) {
      Bot.instance = new Bot();
    }
    return Bot.instance;
  }

  public async start(): Promise<void> {
    try {
      this.logger.info('🔌 Connecting to WhatsApp...');

      const sessionPath = path.join(process.cwd(), 'sessions');
      fs.ensureDirSync(sessionPath);

      const { state, saveCreds } = await useMultiFileAuthState(
        this.config.get('SESSION_ID') || 'default',
        { logger: this.logger as any }
      );

      this.socket = makeWASocket({
        logger: this.logger as any,
        auth: state,
        printQRInTerminal: true,
        browser: ['WhatsApp Bot AI', 'Chrome', '120.0.0.0'],
        patchMessageBeforeSending: (message) => {
          const requiresPatch = !!(
            message.buttonsMessage ||
            message.listMessage ||
            message.templateMessage
          );
          if (requiresPatch) {
            message = {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadataVersion: 2,
                    deviceListMetadata: {},
                  },
                  ...message,
                },
              },
            };
          }
          return message;
        },
        shouldSyncHistoryMessage: () => false,
        defaultQueryTimeoutMs: 30000,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
          if (this.store) {
            const msg = await this.store.loadMessage(key.remoteJid!, key.id!);
            return msg?.message || undefined;
          }
          return undefined;
        },
      });

      this.store?.bind(this.socket.ev);

      this.socket.ev.on('creds.update', saveCreds);

      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          QRCode.generate(qr, { small: true });
          this.logger.info('📱 Scan QR Code with WhatsApp');
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          this.isConnected = false;
          this.logger.warn(`⚠️ Connection closed: ${statusCode}`);

          if (statusCode !== DisconnectReason.loggedOut) {
            this.logger.info('🔄 Reconnecting...');
            setTimeout(() => this.start(), 5000);
          } else {
            this.logger.error('❌ Logged out, please restart');
            await this.session.clearSession();
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.startTime = new Date();
          this.logger.success('✅ Connected to WhatsApp!');
          this.logger.info(`👤 Logged in as: ${this.socket?.user?.name || 'Unknown'}`);
          this.logger.info(`📱 Number: ${this.socket?.user?.id || 'Unknown'}`);
        }
      });

      this.socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        await this.messageHandler.handle(msg, this.socket!);
      });

      this.socket.ev.on('presence.update', async (update) => {
        await this.eventHandler.handlePresence(update);
      });

      this.socket.ev.on('group-participants.update', async (update) => {
        await this.eventHandler.handleGroupParticipants(update, this.socket!);
      });

      this.logger.success('🎯 Bot is ready!');
    } catch (error) {
      this.logger.error('❌ Failed to start bot:', error);
      throw error;
    }
  }

  public async sendMessage(
    jid: string,
    content: AnyMessageContent
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket) {
      this.logger.error('❌ Socket not initialized');
      return undefined;
    }

    try {
      const result = await this.socket.sendMessage(jid, content);
      return result;
    } catch (error) {
      this.logger.error('❌ Failed to send message:', error);
      return undefined;
    }
  }

  public async sendText(jid: string, text: string): Promise<proto.WebMessageInfo | undefined> {
    return this.sendMessage(jid, { text });
  }

  public async sendWithButtons(
    jid: string,
    text: string,
    buttons: { id: string; text: string }[],
    title?: string,
    footer?: string
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.sendMessage(jid, {
      text: text,
      buttons: buttons.map((b) => ({
        buttonId: b.id,
        buttonText: { displayText: b.text },
        type: 1,
      })),
      headerType: 1,
      viewOnce: true,
      ...(title && { header: { title } }),
      ...(footer && { footer: { text: footer } }),
    });
  }

  public async sendList(
    jid: string,
    text: string,
    title: string,
    buttonText: string,
    sections: { title: string; rows: { id: string; title: string; description?: string }[] }[]
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.sendMessage(jid, {
      text: text,
      list: {
        title: title,
        buttonText: buttonText,
        sections: sections,
      },
      footer: { text: '🤖 WhatsApp Bot AI' },
    });
  }

  public async sendImage(
    jid: string,
    imageBuffer: Buffer,
    caption?: string
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.sendMessage(jid, {
      image: imageBuffer,
      caption: caption,
    });
  }

  public getSocket(): WASocket | null {
    return this.socket;
  }

  public isReady(): boolean {
    return this.isConnected && this.socket !== null;
  }

  public getBotName(): string {
    return this.config.get('BOT_NAME');
  }

  public getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  public getUptimeString(): string {
    const diff = this.getUptime();
    const duration = moment.duration(diff);
    const days = duration.days();
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  }
}
