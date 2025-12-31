const settings = require("../settings");

async function channelCommand(sock, chatId, message) {
  const channelLink =
    settings.channelLink ||
    "https://whatsapp.com/channel/0029VbAhWo3C6Zvf2t4Rne0h";
  const channelName = settings.botName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";

  await sock.sendMessage(
    chatId,
    {
      text: `📢 *Join our WhatsApp Channel!*\n\nStay updated with the latest news, updates, and community discussions.\n\n👉 *Link:* ${channelLink}\n\nDon't miss out!`,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          title: `Join ${channelName}`,
          body: "Official Community Channel",
          thumbnailUrl: "https://i.imgur.com/3Uq8b1L.jpeg",
          sourceUrl: channelLink,
          mediaType: 1,
          renderLargerThumbnail: true,
        },
      },
    },
    { quoted: message }
  );
}

module.exports = channelCommand;
