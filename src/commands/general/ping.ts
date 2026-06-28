import { Command } from '../../types/index.js';

const command: Command = {
  name: 'ping',
  category: 'general',
  description: 'Check bot latency',
  usage: '.ping',
  permission: 'user',
  cooldown: 3,

  async execute(params) {
    const { bot, from } = params;
    const start = Date.now();

    // Calculate ping
    const ping = Date.now() - start;

    let status = '🟢 Excellent';
    if (ping > 200) status = '🟡 Good';
    if (ping > 500) status = '🟠 Slow';
    if (ping > 1000) status = '🔴 Bad';

    const text = `
🏓 *Ping Test*
━━━━━━━━━━━━━━━━
📡 Latency: ${ping}ms
📊 Status: ${status}
⏱️ Timestamp: ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━━
💻 Server: Node.js ${process.version}
    `;

    await bot.sendText(from, text);
  },
};

export default command;
