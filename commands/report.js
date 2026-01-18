const { sendText } = require("../lib/sendResponse");

async function reportCommand(sock, chatId, message) {
  const reportMessage = `📢 *Report a Bug or Issue*

We strive to make Samkiel Bot perfect, but bugs happen! 🐛
Please use our support page to file a report:

🔗 *Link:* https://www.samkielbot.app/support#bug

📝 *Recommended Format when reporting:*
• *Command Name:* (e.g., .play, .sticker)
• *Issue Description:* (What happened?)
• *Error Message:* (If any)

Thank you for helping us improve! 🚀\n\n*Powered by SAMKIEL BOT*`;

  // Send the message with a link preview if possible (default text usually handles links)
  await sendText(sock, chatId, reportMessage, { quoted: message });
}

module.exports = { reportCommand };
