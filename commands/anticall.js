const { setAntiCall, getAntiCall } = require("../lib/index");
const { isOwner } = require("../lib/isOwner");

async function anticallCommand(sock, chatId, message, args) {
  // Owner check is handled centrally in main.js
  const option = args[0]?.toLowerCase(); // "on" or "off"

  if (option === "on") {
    await setAntiCall(true);
    await sock.sendMessage(
      chatId,
      {
        text: "✅ *Anti-Call* has been ENABLED.\nThe bot will now reject incoming calls.",
        ...global.channelInfo,
      },
      { quoted: message },
    );
  } else if (option === "off") {
    await setAntiCall(false);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ *Anti-Call* has been DISABLED.\nIncoming calls will not be rejected.",
        ...global.channelInfo,
      },
      { quoted: message },
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
        ...global.channelInfo,
      },
      { quoted: message },
    );
  }
}

module.exports = anticallCommand;
