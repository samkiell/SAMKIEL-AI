const { handleGoodbye } = require("../lib/welcome");
const { isGoodByeOn } = require("../lib/index");
const axios = require("axios");

async function goodbyeCommand(sock, chatId, message, match) {
  if (!chatId.endsWith("@g.us")) {
    await sock.sendMessage(chatId, {
      text: "This command can only be used in groups.",
    });
    return;
  }

  const text =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    "";
  const matchText = text.split(" ").slice(1).join(" ");

  await handleGoodbye(sock, chatId, message, matchText);
}

async function handleLeaveEvent(sock, id, participants) {
  const isGoodbyeEnabled = await isGoodByeOn(id);
  if (!isGoodbyeEnabled) return;

  const groupMetadata = await sock.groupMetadata(id);
  const groupName = groupMetadata.subject;

  for (const participant of participants) {
    try {
      const user = participant.split("@")[0];

      let displayName = user;
      try {
        const groupParticipants = groupMetadata.participants;
        const userParticipant = groupParticipants.find(
          (p) => p.id === participant,
        );
        if (userParticipant?.notify) {
          displayName = userParticipant.notify;
        }
      } catch (e) {}

      let profilePicUrl = "https://i.imgur.com/2wmhkC0.png";
      try {
        const profilePic = await sock.profilePictureUrl(participant, "image");
        if (profilePic) profilePicUrl = profilePic;
      } catch (e) {}

      const apiUrl = `https://api.some-random-api.com/welcome/img/2/gaming1?type=leave&textcolor=red&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&memberCount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePicUrl)}`;

      try {
        const response = await axios.get(apiUrl, {
          responseType: "arraybuffer",
          timeout: 10000,
        });

        if (response.data) {
          await sock.sendMessage(id, {
            image: Buffer.from(response.data),
            caption: `👋 *@${user}* has left the group.`,
            mentions: [participant],
          });
        } else {
          throw new Error("No image");
        }
      } catch (apiError) {
        await sock.sendMessage(id, {
          text: `👋 *@${user}* has left the group.`,
          mentions: [participant],
        });
      }
    } catch (error) {
      console.error("Goodbye error:", error.message);
      const user = participant.split("@")[0];
      await sock.sendMessage(id, {
        text: `👋 *@${user}* has left the group.`,
        mentions: [participant],
      });
    }
  }
}

module.exports = { goodbyeCommand, handleLeaveEvent };
