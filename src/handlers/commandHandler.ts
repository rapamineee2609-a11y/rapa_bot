import { Logger } from '../core/logger.js';
import { Config } from '../core/config.js';
import { Database } from '../core/database.js';
import { CacheManager } from '../core/cache.js';
import { Bot } from '../core/bot.js';
import { Permission } from '../utils/permission.js';
import { Cooldown } from '../utils/cooldown.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { Validator } from '../utils/validator.js';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Command {
  name: string;
  aliases?: string[];
  category: string;
  description: string;
  usage: string;
  permission: 'user' | 'admin' | 'owner';
  cooldown?: number;
  rateLimit?: { max: number; window: number };
  minArgs?: number;
  maxArgs?: number;
  execute: (params: CommandParams) => Promise<void>;
}

interface CommandParams {
  bot: Bot;
  socket: any;
  msg: any;
  args: string[];
  from: string;
  sender: string;
  isGroup: boolean;
  groupId?: string;
  isOwner: boolean;
  isAdmin: boolean;
  isBotAdmin: boolean;
  command: string;
  prefix: string;
}

export class CommandHandler {
  private static instance: CommandHandler;
  private logger: Logger;
  private config: Config;
  private db: Database;
  private cache: CacheManager;
  private commands: Map<string, Command> = new Map();
  private categories: Map<string, Command[]> = new Map();
  private permission: Permission;
  private cooldown: Cooldown;
  private rateLimiter: RateLimiter;
  private validator: Validator;

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = Config.getInstance();
    this.db = Database.getInstance();
    this.cache = CacheManager.getInstance();
    this.permission = Permission.getInstance();
    this.cooldown = Cooldown.getInstance();
    this.rateLimiter = RateLimiter.getInstance();
    this.validator = Validator.getInstance();
    this.loadCommands();
  }

  public static getInstance(): CommandHandler {
    if (!CommandHandler.instance) {
      CommandHandler.instance = new CommandHandler();
    }
    return CommandHandler.instance;
  }

  private loadCommands(): void {
    const commandsPath = path.join(__dirname, '../commands');
    this.loadCommandsFromDir(commandsPath);
    this.logger.info(`📦 Loaded ${this.commands.size} commands in ${this.categories.size} categories`);
  }

  private loadCommandsFromDir(dir: string): void {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        this.loadCommandsFromDir(fullPath);
      } else if (file.name.endsWith('.js') || file.name.endsWith('.ts')) {
        try {
          const imported = require(fullPath);
          const command = imported.default || imported;
          if (command && command.name && command.execute) {
            this.registerCommand(command);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to load command ${file.name}:`, error);
        }
      }
    }
  }

  private registerCommand(command: Command): void {
    const name = command.name.toLowerCase();
    this.commands.set(name, command);

    if (!this.categories.has(command.category)) {
      this.categories.set(command.category, []);
    }
    this.categories.get(command.category)!.push(command);

    if (command.aliases) {
      for (const alias of command.aliases) {
        this.commands.set(alias.toLowerCase(), command);
      }
    }
  }

  public async execute(
    commandName: string,
    params: CommandParams
  ): Promise<boolean> {
    const command = this.commands.get(commandName.toLowerCase());
    if (!command) return false;

    // Permission check
    if (!this.permission.check(params.sender, command.permission, params.isOwner)) {
      await params.bot.sendText(params.from, '❌ You do not have permission to use this command.');
      return true;
    }

    // Cooldown check
    const cooldownKey = `${params.sender}:${command.name}`;
    if (command.cooldown && !this.cooldown.check(cooldownKey, command.cooldown)) {
      const remaining = this.cooldown.getRemaining(cooldownKey);
      await params.bot.sendText(
        params.from,
        `⏳ Please wait ${remaining} seconds before using this command again.`
      );
      return true;
    }

    // Rate limit check
    if (command.rateLimit) {
      const limitKey = `${params.sender}:${command.name}`;
      if (!this.rateLimiter.check(limitKey, command.rateLimit.max, command.rateLimit.window)) {
        await params.bot.sendText(params.from, '⏳ Rate limit exceeded. Please try again later.');
        return true;
      }
    }

    // Argument validation
    const argsCount = params.args.length;
    if (command.minArgs !== undefined && argsCount < command.minArgs) {
      await params.bot.sendText(
        params.from,
        `❌ Usage: ${command.usage || `/${command.name} ${'<args>'}`}`
      );
      return true;
    }
    if (command.maxArgs !== undefined && argsCount > command.maxArgs) {
      await params.bot.sendText(
        params.from,
        `❌ Too many arguments. Usage: ${command.usage || `/${command.name}`}`
      );
      return true;
    }

    // Log command usage
    this.logUsage(command.name, params.sender, params.groupId);

    try {
      await command.execute(params);
      return true;
    } catch (error) {
      this.logger.error(`❌ Error executing command ${command.name}:`, error);
      await params.bot.sendText(
        params.from,
        '❌ An error occurred while executing this command. Please try again later.'
      );
      return true;
    }
  }

  private logUsage(command: string, user: string, groupId?: string): void {
    try {
      const stmt = this.db.getDb().prepare(
        `INSERT INTO command_usage (command, user_number, group_id) VALUES (?, ?, ?)`
      );
      stmt.run(command, user, groupId || null);
    } catch (error) {
      // Silent fail
    }
  }

  public getCommands(): Map<string, Command> {
    return this.commands;
  }

  public getCategories(): Map<string, Command[]> {
    return this.categories;
  }

  public getCommand(name: string): Command | undefined {
    return this.commands.get(name.toLowerCase());
  }

  public getCategoryCommands(category: string): Command[] {
    return this.categories.get(category) || [];
  }

  public getCommandSuggestions(query: string): string[] {
    const results: string[] = [];
    const q = query.toLowerCase();
    for (const [name, cmd] of this.commands) {
      if (name.startsWith(q) && !results.includes(name)) {
        results.push(name);
      }
      if (cmd.aliases) {
        for (const alias of cmd.aliases) {
          if (alias.startsWith(q) && !results.includes(alias)) {
            results.push(alias);
          }
        }
      }
    }
    return results.slice(0, 10);
  }
}
