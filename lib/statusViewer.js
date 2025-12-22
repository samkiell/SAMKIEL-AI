const fs = require("fs");
const path = require("path");
const settings = require("../settings");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

/**
 * Handles automatic status viewing and optional downloading
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} message
 */
async function handleAutoStatus(sock, message) {
  const mode = settings.featureToggles.AUTO_STATUS_VIEW;

  // 1. If disabled, do nothing
  if (!mode || mode === "off") return;

  const chatId = message.key.remoteJid;
  if (chatId !== "status@broadcast") return;

  const senderId = message.key.participant;

  try {
    // 2. View the status: Mark as read
    // Baileys way to mark status as seen:
    await sock.readMessages([message.key]);

    console.log(`👁️ Status viewed from: ${senderId}`);

    // 3. Optional: Reaction/Reply (if configured)
    if (settings.featureToggles.STATUS_VIEW_EMOJI) {
      // Some versions of WhatsApp support reacting to statuses
      // We can try to send a reaction
      try {
        await sock.sendMessage(
          chatId,
          {
            react: {
              text: settings.featureToggles.STATUS_VIEW_EMOJI,
              key: message.key,
            },
          },
          { statusJidList: [senderId] }
        );
      } catch (e) {
        // Fallback or ignore if not supported
      }
    }

    // 4. Download mode check
    if (mode === "on") {
      await downloadStatus(sock, message, senderId);
    }
  } catch (error) {
    console.error("Error in handleAutoStatus:", error);
  }
}

/**
 * Downloads status media to the local filesystem
 */
async function downloadStatus(sock, message, senderId) {
  try {
    const messageType = Object.keys(message.message)[0];
    const supportedTypes = ["imageMessage", "videoMessage"];

    if (!supportedTypes.includes(messageType)) return;

    const buffer = await downloadMediaMessage(message, "buffer", {});
    const ext = messageType === "imageMessage" ? "jpg" : "mp4";
    const fileName = `status_${senderId.split("@")[0]}_${Date.now()}.${ext}`;
    const downloadDir = path.join(__dirname, "../data/status_downloads");

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const filePath = path.join(downloadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    console.log(`📥 Status downloaded: ${filePath}`);
  } catch (error) {
    console.error("Error downloading status:", error);
  }
}

module.exports = { handleAutoStatus };
