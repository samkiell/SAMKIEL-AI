const { isOwner } = require("../lib/isOwner");
const isAdmin = require("../lib/isAdmin");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const { loadPrefix } = require("../lib/prefix");

/**
 * Unified Group Command Handler
 * Usage: .gc <subcommand> [args]
 */
async function groupCommand(sock, chatId, message, args, senderId) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  if (!args || args.length === 0) {
    return sock.sendMessage(chatId, {
      text:
        `*👥 Group Management*\n\n` +
        `*${p}gc create <name>* - Create a new group\n` +
        `*${p}gc setname <name>* - Change group name\n` +
        `*${p}gc setdesc <text>* - Change group description\n` +
        `*${p}gc setpp* - Reply to image to set icon\n` +
        `*${p}gc info* - View group info\n` +
        `*${p}gc revoke* - Reset invite link\n` +
        `*${p}gc open* - Open group (all can send)\n` +
        `*${p}gc close* - Close group (admins only)\n\n` +
        `*Powered by SAMKIEL BOT*`,
      quoted: message,
    });
  }

  const subCmd = args[0].toLowerCase();
  const subArgs = args.slice(1);

  // --- SUBCOMMAND ROUTING ---

  if (subCmd === "create") {
    return await createGc(sock, chatId, message, subArgs, senderId);
  }

  // Group-only check for other commands
  if (!chatId.endsWith("@g.us")) {
    return sock.sendMessage(chatId, {
      text: "❌ This command is for groups only.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  }

  // Access control helper
  const checkAdmin = async () => {
    const checks = await isAdmin(sock, chatId, senderId);
    if (
      !checks.isSenderAdmin &&
      !checks.isGroupOwner &&
      !(await isOwner(senderId))
    ) {
      await sock.sendMessage(chatId, {
        text: "❌ Admins only!\n\n*Powered by SAMKIEL BOT*",
        quoted: message,
      });
      return false;
    }
    if (!checks.isBotAdmin) {
      await sock.sendMessage(chatId, {
        text: "❌ I need to be Admin first.\n\n*Powered by SAMKIEL BOT*",
        quoted: message,
      });
      return false;
    }
    return true;
  };

  if (subCmd === "setname") {
    if (!(await checkAdmin())) return;
    return await setGroupName(sock, chatId, message, subArgs);
  }

  if (subCmd === "setdesc") {
    if (!(await checkAdmin())) return;
    return await setGroupDesc(sock, chatId, message, subArgs);
  }

  if (subCmd === "setpp" || subCmd === "icon") {
    if (!(await checkAdmin())) return;
    return await setGroupPP(sock, chatId, message);
  }

  if (subCmd === "revoke" || subCmd === "reset") {
    if (!(await checkAdmin())) return;
    try {
      await sock.groupRevokeInvite(chatId);
      return sock.sendMessage(chatId, {
        text: "✅ Invite link reset successfully.\n\n*Powered by SAMKIEL BOT*",
        quoted: message,
      });
    } catch (e) {
      return sock.sendMessage(chatId, {
        text: "❌ Failed to reset link.\n\n*Powered by SAMKIEL BOT*",
        quoted: message,
      });
    }
  }

  if (subCmd === "open") {
    if (!(await checkAdmin())) return;
    try {
      await sock.groupSettingUpdate(chatId, "announcement", false);
      return sock.sendMessage(chatId, {
        text: "✅ Group opened! Everyone can send messages.\n\n*Powered by SAMKIEL BOT*",
        quoted: message,
      });
    } catch (e) {
      return sock.sendMessage(chatId, {
        text: "❌ Failed to open group.\n\n*Powered by SAMKIEL BOT*",
        quoted: message,
      });
    }
  }

  if (subCmd === "close") {
    if (!(await checkAdmin())) return;
    try {
      await sock.groupSettingUpdate(chatId, "announcement", true);
      return sock.sendMessage(chatId, {
        text: "✅ Group closed! Only admins can send messages.\n\n*Powered by SAMKIEL BOT*",
        quoted: message,
      });
    } catch (e) {
      return sock.sendMessage(chatId, {
        text: "❌ Failed to close group.\n\n*Powered by SAMKIEL BOT*",
        quoted: message,
      });
    }
  }

  if (subCmd === "info") {
    const metadata = await sock.groupMetadata(chatId);
    const admins = metadata.participants
      .filter((p) => p.admin)
      .map((p) => p.id);
    const owner = metadata.owner || metadata.subjectOwner;

    let txt = `*👥 Group Info*\n\n`;
    txt += `*Name:* ${metadata.subject}\n`;
    txt += `*ID:* ${metadata.id}\n`;
    txt += `*Members:* ${metadata.participants.length}\n`;
    txt += `*Admins:* ${admins.length}\n`;
    txt += `*Owner:* @${owner.split("@")[0]}\n`;
    txt += `*Desc:* ${metadata.desc?.toString() || "None"}\n\n`;
    txt += `*Powered by SAMKIEL BOT*`;

    return sock.sendMessage(
      chatId,
      { text: txt, mentions: [owner] },
      { quoted: message },
    );
  }

  return sock.sendMessage(chatId, {
    text: `❌ Unknown subcommand '${subCmd}'. Use *${p}gc* for help.\n\n*Powered by SAMKIEL BOT*`,
    quoted: message,
  });
}

// --- INTERNAL HELPERS ---

async function createGc(sock, chatId, message, args, senderId) {
  if (!(await isOwner(senderId))) {
    return sock.sendMessage(chatId, {
      text: "❌ Owner command only.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  }
  const groupName = args.join(" ");
  if (!groupName) {
    // Ideally we would pass 'p' or prefix down, but for now lets load it again or handle it.
    // Since this is an internal helper, we might not want to re-require.
    // However, the cleanest quick fix is to check args or pass context.
    // Let's re-require for safety as this is an independent function scope if called elsewhere.
    const { loadPrefix } = require("../lib/prefix");
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    return sock.sendMessage(chatId, {
      text: `⚠️ Provide a group name.\nExample: ${p}gc create My Group\n\n*Powered by SAMKIEL BOT*`,
      quoted: message,
    });
  }

  try {
    await sock.sendMessage(chatId, {
      text: `⏳ Creating group "${groupName}"...`,
    });
    const group = await sock.groupCreate(groupName, [senderId]);
    const code = await sock.groupInviteCode(group.id);
    const link = `https://chat.whatsapp.com/${code}`;

    await sock.sendMessage(
      chatId,
      {
        text: `✅ *Group Created!*\n\n🏷️ *Name:* ${groupName}\n🔗 *Link:* ${link}\n\n*Powered by SAMKIEL BOT*`,
      },
      { quoted: message },
    );
  } catch (err) {
    console.error(err);
    await sock.sendMessage(chatId, {
      text: "❌ Failed to create group.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  }
}

async function setGroupName(sock, chatId, message, args) {
  const newName = args.join(" ");
  if (!newName)
    return sock.sendMessage(chatId, {
      text: "⚠️ Provide a name.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  try {
    await sock.groupUpdateSubject(chatId, newName);
    await sock.sendMessage(chatId, {
      text: `✅ Name changed to: *${newName}*\n\n*Powered by SAMKIEL BOT*`,
      quoted: message,
    });
  } catch (e) {
    await sock.sendMessage(chatId, {
      text: "❌ Failed to update name.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  }
}

async function setGroupDesc(sock, chatId, message, args) {
  const newDesc = args.join(" ");
  if (!newDesc)
    return sock.sendMessage(chatId, {
      text: "⚠️ Provide a description.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  try {
    await sock.groupUpdateDescription(chatId, newDesc);
    await sock.sendMessage(chatId, {
      text: "✅ Description updated.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  } catch (e) {
    await sock.sendMessage(chatId, {
      text: "❌ Failed to update description.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  }
}

async function setGroupPP(sock, chatId, message) {
  const quoted =
    message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const mime =
    quoted?.imageMessage?.mimetype || message.message?.imageMessage?.mimetype;

  if (!mime || !mime.includes("image")) {
    return sock.sendMessage(chatId, {
      text: "⚠️ Reply to an image.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  }

  try {
    const stream = await downloadContentFromMessage(
      quoted ? quoted.imageMessage : message.message.imageMessage,
      "image",
    );
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    const tempPath = path.join(__dirname, `../tmp/pp_${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, buffer);
    await sock.updateProfilePicture(chatId, { url: tempPath });
    fs.unlinkSync(tempPath);

    await sock.sendMessage(chatId, {
      text: "✅ Icon updated.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  } catch (e) {
    await sock.sendMessage(chatId, {
      text: "❌ Failed to update icon.\n\n*Powered by SAMKIEL BOT*",
      quoted: message,
    });
  }
}

module.exports = { groupCommand };
