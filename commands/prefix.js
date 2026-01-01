const { loadPrefix } = require("../lib/prefix");

async function prefixCommand(sock, chatId, message, channelInfo) {
  const currentPrefix = loadPrefix();
  const prefixDisplay =
    currentPrefix === "off" ? "Disabled (None)" : `\`${currentPrefix}\``;

  const p = currentPrefix === "off" ? "" : currentPrefix;

  const response = `📌 *Current Prefix:* ${prefixDisplay}\n\n💡 To change use: \`${p}setprefix [new_prefix]\`\nExample: \`${p}setprefix !\` or \`${p}setprefix off\``;

  await sock.sendMessage(
    chatId,
    { text: response, ...global.channelInfo },
    { quoted: message }
  );
}

module.exports = prefixCommand;
