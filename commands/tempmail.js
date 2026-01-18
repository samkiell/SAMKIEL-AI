const axios = require("axios");
const { sendText } = require("../lib/sendResponse");
const { loadPrefix } = require("../lib/prefix");

// Browser-like headers
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
};

// Store tokens for checking mail later
const emailTokens = new Map();

async function tempmailCommand(sock, chatId) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  try {
    const { data } = await axios.get("https://api.tempmail.lol/generate", {
      timeout: 15000,
      headers: HEADERS,
    });

    if (data?.address && data?.token) {
      // Store token for later use
      emailTokens.set(data.address, data.token);

      return await sendText(
        sock,
        chatId,
        `📧 *Temporary Email Generated*\n\n📩 *Email:* \`${data.address}\`\n\nUse \`${p}checkmail ${data.address}\` to check inbox.\n\n*Powered by SAMKIEL BOT*`,
      );
    }
  } catch (e) {
    console.log("Tempmail: Tempmail.lol failed -", e.message);
  }

  await sendText(
    sock,
    chatId,
    "❌ Tempmail service is currently unavailable. Please try again later.\n\n*Powered by SAMKIEL BOT*",
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
      `Usage: ${p}checkmail <email_address>\nExample: ${p}checkmail demo@example.com\n\n*Powered by SAMKIEL BOT*`,
    );
  }

  // Get stored token
  const token = emailTokens.get(email);

  if (!token) {
    return await sendText(
      sock,
      chatId,
      `❌ Token not found for this email.\n\nPlease generate a new email using \`${p}tempmail\`\n\n*Powered by SAMKIEL BOT*`,
    );
  }

  try {
    const { data } = await axios.get(`https://api.tempmail.lol/auth/${token}`, {
      timeout: 15000,
      headers: HEADERS,
    });

    if (data?.email && Array.isArray(data.email)) {
      if (data.email.length === 0) {
        return await sendText(
          sock,
          chatId,
          `📭 Inbox empty for ${email}\n\nCheck again later!\n\n*Powered by SAMKIEL BOT*`,
        );
      }

      let response = `📧 *Inbox for ${email}*\n\n`;
      for (const msg of data.email.slice(0, 5)) {
        const body = (msg.body || "No content").substring(0, 300);
        response += `🔹 *From:* ${msg.from}\n*Subject:* ${msg.subject || "No Subject"}\n\n${body}\n\n---\n`;
      }
      response += `\n*Powered by SAMKIEL BOT*`;
      return await sendText(sock, chatId, response);
    }
  } catch (e) {
    console.log("Checkmail failed:", e.message);
  }

  await sendText(
    sock,
    chatId,
    "❌ Could not check inbox. Please try again.\n\n*Powered by SAMKIEL BOT*",
  );
}

async function readmailCommand(sock, chatId, message, args) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  return await sendText(
    sock,
    chatId,
    `ℹ️ The \`${p}checkmail\` command now shows the full email content.\n\n*Powered by SAMKIEL BOT*`,
  );
}

module.exports = { tempmailCommand, checkmailCommand, readmailCommand };
