const { setAntiCall, getAntiCall } = require("../lib/index");
const { isOwner } = require("../lib/isOwner");

async function anticallCommand(sock, chatId, message, args) {
  const senderId = message.key.participant || message.key.remoteJid;

  if (!(await isOwner(senderId))) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Only the bot owner can use this command." },
      { quoted: message }
    );
    return;
  }

  const option = args[0]?.toLowerCase(); // "on" or "off"

  if (option === "on") {
    await setAntiCall(true);
    await sock.sendMessage(
      chatId,
      {
        text: "✅ *Anti-Call* has been ENABLED.\nThe bot will now reject incoming calls.",
      },
      { quoted: message }
    );
  } else if (option === "off") {
    await setAntiCall(false);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ *Anti-Call* has been DISABLED.\nIncoming calls will not be rejected.",
      },
      { quoted: message }
    );
  } else {
    // Check current status
    const currentStatus = await getAntiCall();
    await sock.sendMessage(
      chatId,
      {
        text: `📞 *Anti-Call Status*: ${
          currentStatus ? "ENABLED ✅" : "DISABLED ❌"
        }\n\nUsage: *anticall on/off*`,
      },
      { quoted: message }
    );
  }
}

module.exports = anticallCommand;
