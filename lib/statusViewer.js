const fs = require("fs");
const path = require("path");
const settings = require("../settings");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

/**
 * Handles automatic status viewing and optional downloading/reacting
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} message
 */
async function handleAutoStatus(sock, message) {
  const mode = settings.featureToggles.AUTO_STATUS_VIEW;

  // If disabled, do nothing
  if (!mode || mode === "off") return;

  const chatId = message.key.remoteJid;
  if (chatId !== "status@broadcast") return;

  const senderId = message.key.participant;

  try {
    // 1. View the status: Mark as read
    await sock.readMessages([message.key]);
    console.log(`👁️ Status viewed from: ${senderId}`);

    // 2. Handle Auto Reaction (Isolated Logic)
    await handleStatusReaction(sock, message);

    // 3. Handle Auto Message Reply (Isolated Logic)
    await handleStatusReply(sock, message);

    // 4. Handle Download mode
    if (mode === "on") {
      await downloadStatus(sock, message, senderId);
    }
  } catch (error) {
    console.error("Error in handleAutoStatus:", error);
  }
}

/**
 * Isolated logic for status reactions
 */
async function handleStatusReaction(sock, message) {
  const isEnabled = settings.featureToggles.ENABLE_STATUS_REACTION;
  const emoji = settings.featureToggles.STATUS_VIEW_EMOJI;

  if (!isEnabled || !emoji || emoji === "off") return;

  try {
    const senderId = message.key.participant || message.key.remoteJid;

    // Using relayMessage for reliable status reactions
    await sock.relayMessage(
      "status@broadcast",
      {
        reactionMessage: {
          key: {
            remoteJid: "status@broadcast",
            id: message.key.id,
            participant: senderId,
            fromMe: false,
          },
          text: emoji,
        },
      },
      {
        messageId: message.key.id,
        statusJidList: [senderId],
      }
    );
    // Silent success
  } catch (e) {
    console.error("❌ Failed to react to status:", e.message);
  }
}

/**
 * Isolated logic for status reply messages
 */
const repliedStatusIds = new Set();
async function handleStatusReply(sock, message) {
  const statusMsg = settings.featureToggles.STATUS_VIEW_MSG;

  if (!statusMsg || statusMsg === "off") return;

  // Prevent duplicate replies
  if (repliedStatusIds.has(message.key.id)) return;

  try {
    const senderId = message.key.participant || message.key.remoteJid;
    const botName = settings.botName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";

    // Construct branded message
    const finalMsg = `${statusMsg}\n\n*— ${botName}*`;

    await sock.sendMessage(senderId, { text: finalMsg }, { quoted: message });
    console.log(`✉️ Status reply sent to: ${senderId}`);

    // Add to set to prevent future replies
    repliedStatusIds.add(message.key.id);

    // Optional cleanup to prevent memory leak (remove after 24h)
    setTimeout(
      () => repliedStatusIds.delete(message.key.id),
      24 * 60 * 60 * 1000
    );
  } catch (e) {
    console.error("❌ Failed to send status reply:", e.message);
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
