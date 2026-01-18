const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

async function tempmailCommand(sock, chatId) {
  try {
    const { data } = await axios.get(
      "https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1",
    );
    if (data && data.length > 0) {
      const email = data[0];
      await sendText(
        sock,
        chatId,
        `📧 *Temporary Email Generated*\n\n📩 *Email:* ${email}\n\nUse \`.checkmail ${email}\` to read inbox.\n\n*Powered by SAMKIEL BOT*`,
      );
    } else {
      await sendText(sock, chatId, "❌ Failed to generate email.");
    }
  } catch (error) {
    console.error("Tempmail Error:", error);
    await sendText(sock, chatId, "❌ Service unavailable.");
  }
}

async function checkmailCommand(sock, chatId, message, args) {
  const email = args[0];
  if (!email || !email.includes("@")) {
    return await sendText(
      sock,
      chatId,
      "Usage: .checkmail <email_address>\nExample: .checkmail demo@1secmail.com",
    );
  }

  const [login, domain] = email.split("@");

  try {
    const url = `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`;
    const { data } = await axios.get(url);

    if (!data || data.length === 0) {
      return await sendText(sock, chatId, `📭 Inbox empty for ${email}`);
    }

    let response = `📧 *Inbox for ${email}*\n\n`;
    // Show last 5 messages
    for (const msg of data.slice(0, 5)) {
      response += `🔹 *From:* ${msg.from}\n*Subject:* ${msg.subject}\n*ID:* ${msg.id}\n(Use .readmail ${email} ${msg.id} to read)\n---\n`;
    }
    response += `\n*Powered by SAMKIEL BOT*`;
    await sendText(sock, chatId, response);
  } catch (error) {
    console.error("Checkmail Error:", error);
    await sendText(sock, chatId, "❌ Error checking mail.");
  }
}

async function readmailCommand(sock, chatId, message, args) {
  const email = args[0];
  const id = args[1];
  if (!email || !id)
    return await sendText(sock, chatId, "Usage: .readmail <email> <id>");

  const [login, domain] = email.split("@");
  try {
    const url = `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${id}`;
    const { data } = await axios.get(url);
    if (data) {
      const textBody = data.textBody || "No text content";
      await sendText(
        sock,
        chatId,
        `📩 *Subject:* ${data.subject}\n*From:* ${data.from}\n\n${textBody}\n\n*Powered by SAMKIEL BOT*`,
      );
    }
  } catch (e) {
    await sendText(sock, chatId, "❌ Error reading mail.");
  }
}

module.exports = { tempmailCommand, checkmailCommand, readmailCommand };
