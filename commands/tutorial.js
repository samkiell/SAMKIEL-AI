/**
 * Tutorial Command - Beginner friendly guide for the bot
 */

const { loadPrefix } = require("../lib/prefix");

async function tutorialCommand(sock, chatId, message) {
  const prefix = loadPrefix();
  const p = prefix === "off" ? "." : prefix;

  const tutorialText = `
━━━━━━━━━━━━━━━━━━━━━
   📗 *SAMKIEL BOT TUTORIAL*
━━━━━━━━━━━━━━━━━━━━━

👋 *Welcome to SAMKIEL BOT!* 
Here is a quick guide to get you started:

📍 *Where to Use*
The bot works in both *Private Chats* and *Groups*.

⚙️ *How to Use Commands*
All commands must start with a prefix (default is *${p}*). 

💡 *Example Commands:*
• *${p}menu* - View all available features
• *${p}ping* - Check bot's response speed
• *${p}imagine* <text> - Generate AI images
• *${p}sticker* - Convert images to stickers
• *${p}news* - Get latest global news

🤖 *Personal WhatsApp Usage*
The bot is designed to stay out of your way. 
• It ONLY responds to commands starting with *${p}*
• It ignores normal conversations and keywords
• It does not read your private chats unless triggered

🔌 *Bot Control (Owner Only)*
• *turn off* - Completely silence the bot globally
• *turn on* - Re-enable the bot everywhere

━━━━━━━━━━━━━━━━━━━━━
  *Need Help?*
  Join our channel: 
  https://whatsapp.com/channel/0029VbAhWo3C6Zvf2t4Rne0h
━━━━━━━━━━━━━━━━━━━━━
  > *Powered by SAMKIEL BOT*`.trim();

  await sock.sendMessage(chatId, { text: tutorialText }, { quoted: message });
}

module.exports = tutorialCommand;
