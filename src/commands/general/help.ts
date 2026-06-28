import { Command } from '../../types/index.js';

const command: Command = {
  name: 'help',
  aliases: ['?', 'h'],
  category: 'general',
  description: 'Show help for a specific command',
  usage: '.help <command>',
  permission: 'user',
  minArgs: 1,

  async execute(params) {
    const { bot, args, from, prefix } = params;
    const commandName = args[0].toLowerCase();
    const cmd = bot['commandHandler'].getCommand(commandName);

    if (!cmd) {
      await bot.sendText(from, `❌ Command "${commandName}" not found. Use ${prefix}menu to see all commands.`);
      return;
    }

    const helpText = `
📖 *Command: ${cmd.name}*
${cmd.aliases?.length ? `📌 Aliases: ${cmd.aliases.join(', ')}` : ''}
📂 Category: ${cmd.category}
📝 Description: ${cmd.description}
📋 Usage: ${cmd.usage || `${prefix}${cmd.name}`}
🔐 Permission: ${cmd.permission}
⏱️ Cooldown: ${cmd.cooldown || 0}s
🔢 Args: ${cmd.minArgs !== undefined ? `min ${cmd.minArgs}` : 'none'} ${cmd.maxArgs !== undefined ? `max ${cmd.maxArgs}` : ''}
    `;

    await bot.sendText(from, helpText);
  },
};

export default command;
