const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const { loadPrefix } = require("../lib/prefix");

async function tempmailCommand(sock, chatId) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  const providers = [
    {
      name: "1secmail",
      url: "https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1",
      extract: (d) => d?.[0],
    },
    {
      name: "Siputzx",
      url: "https://api.siputzx.my.id/api/tools/tempmail/gen",
      extract: (d) => d?.data?.email || d?.email,
    },
    {
      name: "Vreden",
      url: "https://api.vreden.my.id/api/tools/tempmail/gen",
      extract: (d) => d?.data?.email || d?.email,
    },
  ];

  for (const provider of providers) {
    try {
      const { data } = await axios.get(provider.url, { timeout: 10000 });
      const email = provider.extract(data);

      if (email) {
        return await sendText(
          sock,
          chatId,
          `📧 *Temporary Email Generated*\n\n📩 *Email:* ${email}\n\nUse \`${p}checkmail ${email}\` to check inbox.\n\n*Powered by SAMKIEL BOT*`,
        );
      }
    } catch (error) {
      console.error(`Tempmail (${provider.name}) Error:`, error.message);
    }
  }

  await sendText(
    sock,
    chatId,
    "❌ All tempmail services are currently unavailable. Please try again later.\n\n*Powered by SAMKIEL BOT*",
  );
}

async function checkmailCommand(sock, chatId, message, args) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;
  const email = args[0];
  if (!email || !email.includes("@")) {
    return await sendText(
      sock,
      chatId,
      `Usage: ${p}checkmail <email_address>\nExample: ${p}checkmail demo@1secmail.com\n\n*Powered by SAMKIEL BOT*`,
    );
  }

  const [login, domain] = email.split("@");

  try {
    const url = `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`;
    const { data } = await axios.get(url, { timeout: 10000 });

    if (!data || data.length === 0) {
      return await sendText(
        sock,
        chatId,
        `📭 Inbox empty for ${email}\n\n*Powered by SAMKIEL BOT*`,
      );
    }

    let response = `📧 *Inbox for ${email}*\n\n`;
    for (const msg of data.slice(0, 5)) {
      response += `🔹 *From:* ${msg.from}\n*Subject:* ${msg.subject}\n*ID:* ${msg.id}\n(Use ${p}readmail ${email} ${msg.id} to read)\n---\n`;
    }
    response += `\n*Powered by SAMKIEL BOT*`;
    await sendText(sock, chatId, response);
  } catch (error) {
    console.error("Checkmail Error:", error);
    await sendText(
      sock,
      chatId,
      "❌ Error checking mail. Service might be down.\n\n*Powered by SAMKIEL BOT*",
    );
  }
}

async function readmailCommand(sock, chatId, message, args) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;
  const email = args[0];
  const id = args[1];
  if (!email || !id)
    return await sendText(
      sock,
      chatId,
      `Usage: ${p}readmail <email> <id>\n\n*Powered by SAMKIEL BOT*`,
    );

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
    await sendText(
      sock,
      chatId,
      "❌ Error reading mail.\n\n*Powered by SAMKIEL BOT*",
    );
  }
}

module.exports = { tempmailCommand, checkmailCommand, readmailCommand };
