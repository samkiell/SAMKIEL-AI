/**
 * Temporary Email Commands
 * Uses tempmail.lol API
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");
const { loadPrefix } = require("../lib/prefix");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

const emailTokens = new Map();

async function tempmailCommand(sock, chatId) {
  const p = loadPrefix() === "off" ? "" : loadPrefix();

  try {
    const { data } = await axios.get("https://api.tempmail.lol/generate", {
      timeout: 15000,
      headers: HEADERS,
    });

    if (data?.address && data?.token) {
      emailTokens.set(data.address, data.token);
      return await sendText(
        sock,
        chatId,
        `📧 Temporary Email Generated\n\n📩 Email: ${data.address}\n\nUse ${p}checkmail ${data.address} to check inbox.`,
      );
    }
  } catch (e) {}

  await sendText(
    sock,
    chatId,
    "❌ Tempmail service unavailable. Try again later.",
  );
}

async function checkmailCommand(sock, chatId, message, args) {
  const p = loadPrefix() === "off" ? "" : loadPrefix();
  const email = args[0];

  if (!email || !email.includes("@")) {
    return await sendText(
      sock,
      chatId,
      `Usage: ${p}checkmail <email>\nExample: ${p}checkmail test@example.com`,
    );
  }

  const token = emailTokens.get(email);

  if (!token) {
    return await sendText(
      sock,
      chatId,
      `Token not found for this email.\nGenerate a new email using ${p}tempmail`,
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
          `📭 Inbox empty for ${email}\n\nCheck again later.`,
        );
      }

      let response = `📧 Inbox for ${email}\n\n`;
      for (const msg of data.email.slice(0, 5)) {
        const body = (msg.body || "No content").substring(0, 300);
        response += `From: ${msg.from}\nSubject: ${msg.subject || "No Subject"}\n\n${body}\n\n---\n`;
      }
      return await sendText(sock, chatId, response);
    }
  } catch (e) {}

  await sendText(sock, chatId, "❌ Could not check inbox. Try again.");
}

async function readmailCommand(sock, chatId, message, args) {
  const p = loadPrefix() === "off" ? "" : loadPrefix();
  return await sendText(sock, chatId, `Use ${p}checkmail to view emails.`);
}

module.exports = { tempmailCommand, checkmailCommand, readmailCommand };
