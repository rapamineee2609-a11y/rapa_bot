import { Command } from '../../types/index.js';
import axios from 'axios';
import { CacheManager } from '../../core/cache.js';

const command: Command = {
  name: 'chat',
  aliases: ['ai', 'ask'],
  category: 'AI Assistant',
  description: 'Chat with AI assistant using Gemini or OpenAI',
  usage: '.chat <your question>',
  permission: 'user',
  cooldown: 10,
  minArgs: 1,
  rateLimit: { max: 20, window: 60 },

  async execute(params) {
    const { bot, args, from } = params;
    const query = args.join(' ');
    const cache = CacheManager.getInstance();

    // Check cache
    const cacheKey = `chat:${query.slice(0, 50)}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      await bot.sendText(from, `🤖 *AI Response* (cached)\n\n${cached}`);
      return;
    }

    try {
      // Try Gemini first
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: query }] }],
          },
          { timeout: 30000 }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        cache.set(cacheKey, text, 3600);
        await bot.sendText(from, `🤖 *AI Response*\n\n${text}`);
        return;
      }

      // Fallback to a free API
      const response = await axios.get(
        `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(query)}`,
        { timeout: 15000 }
      );

      const text = response.data?.response || 'Maaf, saya tidak bisa menjawab saat ini.';
      cache.set(cacheKey, text, 1800);
      await bot.sendText(from, `🤖 *AI Response*\n\n${text}`);
    } catch (error) {
      await bot.sendText(
        from,
        '❌ Maaf, terjadi kesalahan saat memproses permintaan AI. Silakan coba lagi nanti.'
      );
    }
  },
};

export default command;
