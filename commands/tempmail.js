const axios = require("axios");
const { sendText } = require("../lib/sendResponse");
const { loadPrefix } = require("../lib/prefix");

// Browser-like headers to avoid 403
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
};

async function tempmailCommand(sock, chatId) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  const providers = [
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
    {
      name: "Gifted",
      url: "https://api.giftedtech.my.id/api/tools/tempmail?apikey=gifted",
      extract: (d) => d?.result?.email || d?.email,
    },
    {
      name: "1secmail",
      url: "https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1",
      extract: (d) => d?.[0],
    },
  ];

  for (const provider of providers) {
    try {
      const { data } = await axios.get(provider.url, {
        timeout: 10000,
        headers: HEADERS,
      });
      const email = provider.extract(data);

      if (email) {
        return await sendText(
          sock,
          chatId,
          `📧 *Temporary Email Generated*\n\n📩 *Email:* ${email}\n\nUse \`${p}checkmail ${email}\` to check inbox.\n\n*Powered by SAMKIEL BOT*`,
        );
      }
    } catch (error) {
      console.log(`Tempmail (${provider.name}) failed: ${error.message}`);
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

  // Try multiple check APIs
  const checkApis = [
    {
      name: "Siputzx",
      url: `https://api.siputzx.my.id/api/tools/tempmail/inbox?email=${encodeURIComponent(email)}`,
      extract: (d) => d?.data || d?.messages || [],
    },
    {
      name: "1secmail",
      url: `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`,
      extract: (d) => d || [],
    },
  ];

  for (const api of checkApis) {
    try {
      const { data } = await axios.get(api.url, {
        timeout: 10000,
        headers: HEADERS,
      });
      const messages = api.extract(data);

      if (Array.isArray(messages)) {
        if (messages.length === 0) {
          return await sendText(
            sock,
            chatId,
            `📭 Inbox empty for ${email}\n\n*Powered by SAMKIEL BOT*`,
          );
        }

        let response = `📧 *Inbox for ${email}*\n\n`;
        for (const msg of messages.slice(0, 5)) {
          const from = msg.from || msg.sender || "Unknown";
          const subject = msg.subject || "No Subject";
          const id = msg.id || msg.messageId || "0";
          response += `🔹 *From:* ${from}\n*Subject:* ${subject}\n*ID:* ${id}\n(Use ${p}readmail ${email} ${id} to read)\n---\n`;
        }
        response += `\n*Powered by SAMKIEL BOT*`;
        return await sendText(sock, chatId, response);
      }
    } catch (error) {
      console.log(`Checkmail (${api.name}) failed: ${error.message}`);
    }
  }

  await sendText(
    sock,
    chatId,
    "❌ Error checking mail. Service might be down.\n\n*Powered by SAMKIEL BOT*",
  );
}

async function readmailCommand(sock, chatId, message, args) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;
  const email = args[0];
  const id = args[1];

  if (!email || !id) {
    return await sendText(
      sock,
      chatId,
      `Usage: ${p}readmail <email> <id>\n\n*Powered by SAMKIEL BOT*`,
    );
  }

  const [login, domain] = email.split("@");

  const readApis = [
    {
      name: "Siputzx",
      url: `https://api.siputzx.my.id/api/tools/tempmail/read?email=${encodeURIComponent(email)}&id=${id}`,
      extract: (d) => ({
        subject: d?.data?.subject || d?.subject,
        from: d?.data?.from || d?.from,
        body: d?.data?.body || d?.data?.textBody || d?.body || d?.textBody,
      }),
    },
    {
      name: "1secmail",
      url: `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${id}`,
      extract: (d) => ({
        subject: d?.subject,
        from: d?.from,
        body: d?.textBody || d?.body,
      }),
    },
  ];

  for (const api of readApis) {
    try {
      const { data } = await axios.get(api.url, {
        timeout: 10000,
        headers: HEADERS,
      });
      const mail = api.extract(data);

      if (mail && (mail.subject || mail.body)) {
        const textBody = mail.body || "No text content";
        return await sendText(
          sock,
          chatId,
          `📩 *Subject:* ${mail.subject || "No Subject"}\n*From:* ${mail.from || "Unknown"}\n\n${textBody}\n\n*Powered by SAMKIEL BOT*`,
        );
      }
    } catch (error) {
      console.log(`Readmail (${api.name}) failed: ${error.message}`);
    }
  }

  await sendText(
    sock,
    chatId,
    "❌ Error reading mail.\n\n*Powered by SAMKIEL BOT*",
  );
}

module.exports = { tempmailCommand, checkmailCommand, readmailCommand };
