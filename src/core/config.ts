import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';
import { merge } from 'lodash-es';

dotenv.config();

interface ConfigSchema {
  BOT_NAME: string;
  OWNER_NUMBER: string;
  PREFIX: string;
  SESSION_ID: string;
  LANGUAGE: string;
  MENU_STYLE: string;
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  RAPIDAPI_KEY: string;
  DB_PATH: string;
  LOG_LEVEL: string;
  LOG_FILE: string;
  AUTO_READ: boolean;
  ANTI_SPAM: boolean;
  WELCOME_ENABLED: boolean;
  AUTO_BACKUP: boolean;
  MAX_MEMORY: number;
  AUTO_RESTART: boolean;
  UPDATE_CHECK: boolean;
}

const defaults: Partial<ConfigSchema> = {
  BOT_NAME: 'MyAI_Bot',
  PREFIX: '.',
  LANGUAGE: 'id',
  MENU_STYLE: 'modern',
  LOG_LEVEL: 'info',
  AUTO_READ: true,
  ANTI_SPAM: true,
  WELCOME_ENABLED: true,
  AUTO_BACKUP: true,
  MAX_MEMORY: 512,
  AUTO_RESTART: true,
  UPDATE_CHECK: true,
};

export class Config {
  private static instance: Config;
  private config: ConfigSchema;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(process.cwd(), 'config.json');
    this.config = this.loadConfig();
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private loadConfig(): ConfigSchema {
    const env: any = process.env;
    const fileConfig: Partial<ConfigSchema> = fs.existsSync(this.configPath)
      ? fs.readJsonSync(this.configPath)
      : {};

    const merged = merge({}, defaults, fileConfig, {
      BOT_NAME: env.BOT_NAME || defaults.BOT_NAME,
      OWNER_NUMBER: env.OWNER_NUMBER || '',
      PREFIX: env.PREFIX || defaults.PREFIX,
      SESSION_ID: env.SESSION_ID || 'default_session',
      LANGUAGE: env.LANGUAGE || defaults.LANGUAGE,
      MENU_STYLE: env.MENU_STYLE || defaults.MENU_STYLE,
      GEMINI_API_KEY: env.GEMINI_API_KEY || '',
      OPENAI_API_KEY: env.OPENAI_API_KEY || '',
      RAPIDAPI_KEY: env.RAPIDAPI_KEY || '',
      DB_PATH: env.DB_PATH || './data/bot.db',
      LOG_LEVEL: env.LOG_LEVEL || defaults.LOG_LEVEL,
      LOG_FILE: env.LOG_FILE || './logs/bot.log',
      AUTO_READ: env.AUTO_READ === 'true' || defaults.AUTO_READ,
      ANTI_SPAM: env.ANTI_SPAM === 'true' || defaults.ANTI_SPAM,
      WELCOME_ENABLED: env.WELCOME_ENABLED === 'true' || defaults.WELCOME_ENABLED,
      AUTO_BACKUP: env.AUTO_BACKUP === 'true' || defaults.AUTO_BACKUP,
      MAX_MEMORY: parseInt(env.MAX_MEMORY || String(defaults.MAX_MEMORY)),
      AUTO_RESTART: env.AUTO_RESTART === 'true' || defaults.AUTO_RESTART,
      UPDATE_CHECK: env.UPDATE_CHECK === 'true' || defaults.UPDATE_CHECK,
    });

    return merged as ConfigSchema;
  }

  public get<T = any>(key: keyof ConfigSchema): T {
    return this.config[key] as T;
  }

  public set<T = any>(key: keyof ConfigSchema, value: T): void {
    (this.config as any)[key] = value;
    this.saveConfig();
  }

  public getAll(): ConfigSchema {
    return { ...this.config };
  }

  private saveConfig(): void {
    fs.writeJsonSync(this.configPath, this.config, { spaces: 2 });
  }
}
