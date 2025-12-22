const settings = require("../settings");

async function ownerCommand(sock, chatId) {
  const ownerName = settings.ownerName || "SAMKIEL";
  const ownerNo = settings.ownerNumber || "2348087357158";

  const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
TEL;waid=${ownerNo}:${ownerNo}
END:VCARD
`;

  await sock.sendMessage(chatId, {
    contacts: { displayName: ownerName, contacts: [{ vcard }] },
  });
}

module.exports = ownerCommand;
