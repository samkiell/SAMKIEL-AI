const fs = require("fs");
const path = require("path");
const os = require("os");
const { jidNormalizedUser } = require("@whiskeysockets/baileys");

/**
 * VCF Utility for Group Contacts
 */
async function vcfCommand(sock, chatId, message) {
  try {
    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(
        chatId,
        { text: "❌ This command is for groups only." },
        { quoted: message },
      );
    }

    await sock.sendMessage(
      chatId,
      { text: "⏳ Generating Group VCF..." },
      { quoted: message },
    );

    // Fetch Metadata
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants;

    if (!participants || participants.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "❌ No participants found." },
        { quoted: message },
      );
    }

    let vcfContent = "";
    let count = 0;
    const uniqueNumbers = new Set();
    const store = sock.store || {}; // Handle if store is undefined

    const groupName = groupMetadata.subject || "Group";
    const safeGroupName =
      groupName.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Contacts";

    for (const member of participants) {
      let jid = jidNormalizedUser(member.id);

      // Safety check
      if (!jid.endsWith("@s.whatsapp.net")) continue;

      const number = jid.split("@")[0];

      // Deduplicate
      if (uniqueNumbers.has(number)) continue;
      uniqueNumbers.add(number);

      // Determine Name
      let name = `Member_${count + 1}`;

      // 1. Check Contact Store
      if (store.contacts && store.contacts[jid]) {
        const contact = store.contacts[jid];
        name = contact.name || contact.notify || contact.verifiedName || name;
      }

      // 2. Special override for Developer (example)
      if (number === "2348087357158") name = "SAMKIEL DEV";

      // VCard Format
      vcfContent +=
        `BEGIN:VCARD\n` +
        `VERSION:3.0\n` +
        `FN:${name}\n` +
        `TEL;type=CELL;type=VOICE;waid=${number}:+${number}\n` +
        `END:VCARD\n`;

      count++;
    }

    if (count === 0) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Failed to generate contacts." },
        { quoted: message },
      );
    }

    // Save to temp
    const fileName = `${safeGroupName}_${Date.now()}.vcf`;
    const filePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(filePath, vcfContent);

    // Send
    await sock.sendMessage(
      chatId,
      {
        document: { url: filePath },
        mimetype: "text/vcard",
        fileName: fileName,
        caption: `📇 *Group Contacts Export*\n\n✅ *${count}* contacts saved.\n📁 *Group:* ${groupName}`,
      },
      { quoted: message },
    );

    // Cleanup
    try {
      fs.unlinkSync(filePath);
    } catch {}
  } catch (err) {
    console.error("VCF Error:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Error generating VCF file." },
      { quoted: message },
    );
  }
}

module.exports = { vcfCommand };
