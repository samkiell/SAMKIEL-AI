/**
 * VCF Export Command - Export group contacts as VCF file
 */

const fs = require("fs");
const path = require("path");
const { sendReaction } = require("../lib/reactions");

async function vcfCommand(sock, chatId, message) {
  const isGroup = chatId.endsWith("@g.us");

  if (!isGroup) {
    return await sock.sendMessage(
      chatId,
      {
        text: "This command only works in groups.",
      },
      { quoted: message },
    );
  }

  try {
    await sendReaction(sock, message, "📇");

    const groupMeta = await sock.groupMetadata(chatId);
    const participants = groupMeta.participants || [];

    if (participants.length === 0) {
      return await sock.sendMessage(
        chatId,
        {
          text: "No participants found in this group.",
        },
        { quoted: message },
      );
    }

    // Build VCF content with proper formatting
    let vcfContent = "";
    let count = 0;

    for (const participant of participants) {
      const number = participant.id.split("@")[0];
      const name = participant.notify || number;

      vcfContent += "BEGIN:VCARD\r\n";
      vcfContent += "VERSION:3.0\r\n";
      vcfContent += `FN:${name}\r\n`;
      vcfContent += `TEL;TYPE=CELL:+${number}\r\n`;
      vcfContent += "END:VCARD\r\n";
      count++;
    }

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const groupName = (groupMeta.subject || "group").replace(
      /[^a-zA-Z0-9]/g,
      "_",
    );
    const tempPath = path.join(tempDir, `${groupName}_${Date.now()}.vcf`);
    fs.writeFileSync(tempPath, vcfContent);

    await sock.sendMessage(
      chatId,
      {
        document: fs.readFileSync(tempPath),
        fileName: `${groupName}_contacts.vcf`,
        mimetype: "text/vcard",
        caption: `📇 Exported ${count} contacts from ${groupMeta.subject}`,
      },
      { quoted: message },
    );

    // Cleanup
    try {
      fs.unlinkSync(tempPath);
    } catch (e) {}

    await sendReaction(sock, message, "✅");
  } catch (error) {
    await sendReaction(sock, message, "❌");
    await sock.sendMessage(
      chatId,
      {
        text: `Error: ${error.message}`,
      },
      { quoted: message },
    );
  }
}

module.exports = { vcfCommand };
