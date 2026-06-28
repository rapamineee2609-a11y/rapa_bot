import dotenv from 'dotenv';
import { z } from 'zod';
import chalk from 'chalk';

dotenv.config();

const envSchema = z.object({
  BOT_NAME: z.string().default('MyAI_Bot'),
  OWNER_NUMBER: z.string().min(10, 'Owner number must be at least 10 digits'),
  PREFIX: z.string().default('.'),
  SESSION_ID: z.string().default('default_session'),
  LANGUAGE: z.string().default('id'),
  MENU_STYLE: z.string().default('modern'),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  RAPIDAPI_KEY: z.string().optional(),
  DB_PATH: z.string().default('./data/bot.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FILE: z.string().default('./logs/bot.log'),
  AUTO_READ: z.string().transform(v => v === 'true').default('true'),
  ANTI_SPAM: z.string().transform(v => v === 'true').default('true'),
  WELCOME_ENABLED: z.string().transform(v => v === 'true').default('true'),
  AUTO_BACKUP: z.string().transform(v => v === 'true').default('true'),
  MAX_MEMORY: z.string().transform(Number).default('512'),
  AUTO_RESTART: z.string().transform(v => v === 'true').default('true'),
  UPDATE_CHECK: z.string().transform(v => v === 'true').default('true'),
});

try {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error(chalk.red('❌ Environment validation failed:'));
    result.error.errors.forEach(err => {
      console.error(chalk.red(`  - ${err.path.join('.')}: ${err.message}`));
    });
    process.exit(1);
  }
  console.log(chalk.green('✅ Environment variables validated successfully'));
  console.log(chalk.cyan(`🤖 Bot: ${result.data.BOT_NAME}`));
  console.log(chalk.cyan(`👑 Owner: ${result.data.OWNER_NUMBER}`));
  console.log(chalk.cyan(`🔖 Prefix: ${result.data.PREFIX}`));
} catch (error) {
  console.error(chalk.red('❌ Validation error:'), error);
  process.exit(1);
}
