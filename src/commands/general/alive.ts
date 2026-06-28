import { Command } from '../../types/index.js';

const command: Command = {
  name: 'alive',
  aliases: ['ping', 'status'],
  category: 'general',
  description: 'Check if bot is alive and responsive',
  usage: '.alive',
  permission: 'user',
  cooldown: 3,

  async execute(params) {
    const { bot, from } = params;
    const start = Date.now();
    const ping = Date.now() - start;

    const statusText = `
🤖 *Bot Status*
━━━━━━━━━━━━━━━━━━━━
✅ Status: Online
📶 Ping: ${ping}ms
⏱️ Uptime: ${bot.getUptimeString()}
📱 Version: 3.0.0
👤 Bot: ${bot.getBotName()}
━━━━━━━━━━━━━━━━━━━━
💚 Bot is alive and running smoothly!
    `;

    await bot.sendText(from, statusText);
  },
};

export default command;
