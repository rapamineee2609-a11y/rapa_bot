import { Command } from '../../types/index.js';
import axios from 'axios';

const command: Command = {
  name: 'ytinfo',
  aliases: ['youtube', 'yt'],
  category: 'Downloader',
  description: 'Get YouTube video information',
  usage: '.ytinfo <url>',
  permission: 'user',
  minArgs: 1,
  cooldown: 10,

  async execute(params) {
    const { bot, args, from } = params;
    const url = args[0];

    try {
      // Using a free YouTube info API
      const response = await axios.get(
        `https://api.popcat.xyz/ytinfo?url=${encodeURIComponent(url)}`,
        { timeout: 15000 }
      );

      const data = response.data;
      if (!data || !data.title) {
        await bot.sendText(from, '❌ Video tidak ditemukan.');
        return;
      }

      const info = `
🎬 *YouTube Info*
━━━━━━━━━━━━━━━━━━━━
📌 Title: ${data.title}
👤 Channel: ${data.channel}
👀 Views: ${data.views?.toLocaleString() || 'N/A'}
❤️ Likes: ${data.likes?.toLocaleString() || 'N/A'}
⏱️ Duration: ${data.duration || 'N/A'}
📅 Uploaded: ${data.uploaded || 'N/A'}
🔗 URL: ${url}
━━━━━━━━━━━━━━━━━━━━
📎 *Download options:*
• Audio: .ytaudio ${url}
• Video: .ytvideo ${url}
      `;

      await bot.sendText(from, info);
    } catch (error) {
      await bot.sendText(from, '❌ Gagal mendapatkan info video. Pastikan URL valid.');
    }
  },
};

export default command;
