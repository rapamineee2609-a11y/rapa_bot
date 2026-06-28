import figlet from 'figlet';
import gradient from 'gradient-string';
import os from 'os';
import { Command } from '../../types/index.js';
import { formatBytes, formatUptime } from '../../utils/formatter.js';

const command: Command = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  category: 'general',
  description: 'Show bot menu with all commands',
  usage: '.menu [category]',
  permission: 'user',
  cooldown: 5,
  rateLimit: { max: 10, window: 60 },

  async execute(params) {
    const { bot, args, from, prefix } = params;

    // If specific category requested
    if (args.length > 0) {
      const category = args[0].toLowerCase();
      const commands = bot['commandHandler'].getCategoryCommands(category);
      if (commands.length > 0) {
        let text = `📂 *Category: ${category.toUpperCase()}*\n\n`;
        for (const cmd of commands) {
          text += `▸ ${prefix}${cmd.name}`;
          if (cmd.aliases?.length) {
            text += ` (${cmd.aliases.join(', ')})`;
          }
          text += `\n  ${cmd.description}\n`;
        }
        await bot.sendText(from, text);
        return;
      }
    }

    // Full menu with banner
    const banner = gradient.pastel(figlet.textSync('BOT AI', { font: 'Standard' }));

    const memoryUsed = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const menuText = `
╔══════════════════════════════════════╗
║     ${banner}     ║
╠══════════════════════════════════════╣
║  🤖 *${bot.getBotName()}* v3.0.0
║  📱 ${bot.getSocket()?.user?.id || 'Unknown'}
║  ⏱️ Uptime: ${bot.getUptimeString()}
║  🧠 RAM: ${formatBytes(usedMem)} / ${formatBytes(totalMem)}
║  💾 Node: ${process.version}
║  📦 Platform: ${os.platform()} ${os.arch()}
║  👑 Owner: ${process.env.OWNER_NUMBER || 'Not set'}
║  🔖 Prefix: ${prefix}
╠══════════════════════════════════════╣
║  📚 *COMMAND CATEGORIES*
╠══════════════════════════════════════╣`;

    const categories = bot['commandHandler'].getCategories();
    let catText = '';
    const catList: string[] = [];
    for (const [category, commands] of categories) {
      catList.push(`  ${category}: ${commands.length} commands`);
    }
    catText = catList.join('\n');

    const footer = `
╠══════════════════════════════════════╣
║  📌 Use ${prefix}menu <category> for details
║  📌 Example: ${prefix}menu ai
╚══════════════════════════════════════╝`;

    await bot.sendText(from, menuText + '\n' + catText + '\n' + footer);
  },
};

export default command;
