const { loadPrefix } = require("../lib/prefix");

async function prefixCommand(sock, chatId, message, channelInfo) {
  const currentPrefix = loadPrefix();
  const prefixDisplay =
    currentPrefix === "off" ? "Disabled (None)" : `\`${currentPrefix}\``;

  const response = `📌 *Current Prefix:* ${prefixDisplay}\n\n💡 To change use: \`.setprefix [new_prefix]\`\nExample: \`.setprefix !\` or \`.setprefix off\``;

  await sock.sendMessage(chatId, { text: response }, { quoted: message });
}

module.exports = prefixCommand;
