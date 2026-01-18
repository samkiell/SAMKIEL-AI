/**
 * VCF Export Command - Export group contacts as VCF
 */

const fs = require("fs");
const path = require("path");
const { loadPrefix } = require("../lib/prefix");

async function vcfCommand(sock, chatId, message) {
  const p = loadPrefix() === "off" ? "" : loadPrefix();
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
    await sock.sendMessage(chatId, { react: { text: "📇", key: message.key } });

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

    // Build VCF content
    let vcfContent = "";
    for (const p of participants) {
      const number = p.id.split("@")[0];
      vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${number}\nTEL:+${number}\nEND:VCARD\n`;
    }

    const tempPath = path.join(__dirname, "../temp", `group_${Date.now()}.vcf`);
    fs.writeFileSync(tempPath, vcfContent);

    await sock.sendMessage(
      chatId,
      {
        document: fs.readFileSync(tempPath),
        fileName: `${groupMeta.subject || "group"}_contacts.vcf`,
        mimetype: "text/vcard",
      },
      { quoted: message },
    );

    fs.unlinkSync(tempPath);
    await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
  } catch (error) {
    console.log(`[VCF] Error: ${error.message}`);
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
