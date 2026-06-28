import { Command } from '../../types/index.js';
import axios from 'axios';

const command: Command = {
  name: 'summarize',
  aliases: ['ringkas'],
  category: 'AI Assistant',
  description: 'Summarize long text',
  usage: '.summarize <text>',
  permission: 'user',
  minArgs: 1,
  cooldown: 15,

  async execute(params) {
    const { bot, args, from } = params;
    const text = args.join(' ');

    if (text.length < 20) {
      await bot.sendText(from, '❌ Teks terlalu pendek untuk diringkas. Minimal 20 karakter.');
      return;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        await bot.sendText(from, '❌ API key tidak tersedia. Silakan tambahkan GEMINI_API_KEY di .env');
        return;
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: `Ringkas teks berikut menjadi maksimal 5 kalimat: "${text}"`
            }]
          }]
        },
        { timeout: 30000 }
      );

      const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Gagal merangkum.';
      await bot.sendText(from, `📝 *Ringkasan*\n\n${summary}`);
    } catch (error) {
      await bot.sendText(from, '❌ Gagal merangkum teks. Silakan coba lagi.');
    }
  },
};

export default command;
