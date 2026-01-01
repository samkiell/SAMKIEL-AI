async function groupInfoCommand(sock, chatId, msg) {
  try {
    // Get group metadata
    const groupMetadata = await sock.groupMetadata(chatId);

    // Get group profile picture
    let pp;
    try {
      pp = await sock.profilePictureUrl(chatId, "image");
    } catch {
      pp = "https://i.imgur.com/2wzGhpF.jpeg"; // Default image
    }

    // Get group invite link
    let inviteCode = "";
    try {
      inviteCode = await sock.groupInviteCode(chatId);
    } catch {
      inviteCode = "Error fetching link";
    }
    const inviteLink =
      inviteCode !== "Error fetching link"
        ? `https://chat.whatsapp.com/${inviteCode}`
        : "Not available (Bot needs admin rights)";

    // Get admins from participants
    const participants = groupMetadata.participants;
    const groupAdmins = participants.filter((p) => p.admin);
    const listAdmin = groupAdmins
      .map((v, i) => `${i + 1}. @${v.id.split("@")[0]}`)
      .join("\n");

    // Get group owner
    const owner =
      groupMetadata.owner ||
      groupAdmins.find((p) => p.admin === "superadmin")?.id ||
      chatId.split("-")[0] + "@s.whatsapp.net";

    // Create info text
    const text = `
┌──「 *GROUP INFO* 」
▢ *🔖NAME* : 
• ${groupMetadata.subject}
▢ *♻️ID:*
   • ${groupMetadata.id}
▢ *👥Members* :
• ${participants.length}
▢ *🤿Group Owner:*
• @${owner.split("@")[0]}
▢ *🕵🏻‍♂️Admins:*
${listAdmin}

▢ *📌Description* :
   • ${groupMetadata.desc?.toString() || "No description Provided!"}

▢ *🔗 Invite Link :*
   • ${inviteLink}
`.trim();

    // Send the message with image and mentions
    await sock.sendMessage(chatId, {
      image: { url: pp },
      caption: text,
      mentions: [...groupAdmins.map((v) => v.id), owner],
      contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363400862271383@newsletter",
          newsletterName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
          serverMessageId: -1,
        },
      },
    });
  } catch (error) {
    console.error("Error in groupinfo command:", error);
    await sock.sendMessage(chatId, { text: "Failed to get group info!" });
  }
}

module.exports = groupInfoCommand;
