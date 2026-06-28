import pino from 'pino';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { Config } from './config.js';

export class Logger {
  private static instance: Logger;
  private logger: pino.Logger;
  private config: Config;

  private constructor() {
    this.config = Config.getInstance();
    const logLevel = this.config.get('LOG_LEVEL') || 'info';
    const logFile = this.config.get('LOG_FILE') || './logs/bot.log';

    // Ensure log directory exists
    fs.ensureDirSync(path.dirname(logFile));

    const prettyTransport = pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    });

    const fileTransport = pino.transport({
      target: 'pino/file',
      options: { destination: logFile },
    });

    this.logger = pino(
      { level: logLevel, base: undefined },
      pino.multistream([
        { stream: prettyTransport, level: logLevel },
        { stream: fileTransport, level: 'info' },
      ])
    );
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public info(message: string, ...args: any[]): void {
    this.logger.info(chalk.cyan(message), ...args);
  }

  public error(message: string, ...args: any[]): void {
    this.logger.error(chalk.red(message), ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.logger.warn(chalk.yellow(message), ...args);
  }

  public debug(message: string, ...args: any[]): void {
    this.logger.debug(chalk.magenta(message), ...args);
  }

  public success(message: string, ...args: any[]): void {
    this.logger.info(chalk.green(message), ...args);
  }

  public custom(level: string, message: string, ...args: any[]): void {
    this.logger.log({ level }, message, ...args);
  }
}
