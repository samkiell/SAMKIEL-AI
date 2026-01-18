const axios = require("axios");
const { sendText } = require("../lib/sendResponse");
const { loadPrefix } = require("../lib/prefix");

// Browser-like headers
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
};

async function tempmailCommand(sock, chatId) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  // Try Guerrillamail first (most reliable)
  try {
    const { data } = await axios.get(
      "https://api.guerrillamail.com/ajax.php?f=get_email_address",
      { timeout: 15000, headers: HEADERS },
    );

    if (data?.email_addr) {
      return await sendText(
        sock,
        chatId,
        `📧 *Temporary Email Generated*\n\n📩 *Email:* ${data.email_addr}\n\nUse \`${p}checkmail ${data.email_addr}\` to check inbox.\n\n*Powered by SAMKIEL BOT*`,
      );
    }
  } catch (e) {
    console.log("Tempmail: Guerrillamail failed -", e.message);
  }

  // Try Tempmail.lol
  try {
    const { data } = await axios.get("https://api.tempmail.lol/generate", {
      timeout: 15000,
      headers: HEADERS,
    });

    if (data?.address) {
      return await sendText(
        sock,
        chatId,
        `📧 *Temporary Email Generated*\n\n📩 *Email:* ${data.address}\n*Token:* \`${data.token}\`\n\nUse \`${p}checkmail ${data.address}\` to check inbox.\n\n*Powered by SAMKIEL BOT*`,
      );
    }
  } catch (e) {
    console.log("Tempmail: Tempmail.lol failed -", e.message);
  }

  // Try Mail.tm
  try {
    // Get domain first
    const domainsRes = await axios.get("https://api.mail.tm/domains", {
      timeout: 10000,
      headers: HEADERS,
    });
    const domain = domainsRes.data?.["hydra:member"]?.[0]?.domain;

    if (domain) {
      // Generate random email
      const randomUser =
        "samkiel" + Math.random().toString(36).substring(2, 10);
      const email = `${randomUser}@${domain}`;

      // Create account
      const createRes = await axios.post(
        "https://api.mail.tm/accounts",
        { address: email, password: "TempPass123!" },
        {
          timeout: 10000,
          headers: { ...HEADERS, "Content-Type": "application/json" },
        },
      );

      if (createRes.data?.address) {
        return await sendText(
          sock,
          chatId,
          `📧 *Temporary Email Generated*\n\n📩 *Email:* ${createRes.data.address}\n\nUse \`${p}checkmail ${createRes.data.address}\` to check inbox.\n\n*Powered by SAMKIEL BOT*`,
        );
      }
    }
  } catch (e) {
    console.log("Tempmail: Mail.tm failed -", e.message);
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
      `Usage: ${p}checkmail <email_address>\nExample: ${p}checkmail demo@guerrillamail.com\n\n*Powered by SAMKIEL BOT*`,
    );
  }

  // Try Guerrillamail check
  try {
    const { data } = await axios.get(
      `https://api.guerrillamail.com/ajax.php?f=check_email&seq=0&email_addr=${encodeURIComponent(email)}`,
      { timeout: 15000, headers: HEADERS },
    );

    if (data?.list && Array.isArray(data.list)) {
      if (data.list.length === 0) {
        return await sendText(
          sock,
          chatId,
          `📭 Inbox empty for ${email}\n\n*Powered by SAMKIEL BOT*`,
        );
      }

      let response = `📧 *Inbox for ${email}*\n\n`;
      for (const msg of data.list.slice(0, 5)) {
        response += `🔹 *From:* ${msg.mail_from}\n*Subject:* ${msg.mail_subject}\n*ID:* ${msg.mail_id}\n(Use ${p}readmail ${email} ${msg.mail_id} to read)\n---\n`;
      }
      response += `\n*Powered by SAMKIEL BOT*`;
      return await sendText(sock, chatId, response);
    }
  } catch (e) {
    console.log("Checkmail: Guerrillamail failed -", e.message);
  }

  // Try Tempmail.lol check
  try {
    const token = args[1]; // If provided
    if (token) {
      const { data } = await axios.get(
        `https://api.tempmail.lol/auth/${token}`,
        { timeout: 15000, headers: HEADERS },
      );

      if (data?.email) {
        if (!data.email.length) {
          return await sendText(
            sock,
            chatId,
            `📭 Inbox empty for ${email}\n\n*Powered by SAMKIEL BOT*`,
          );
        }

        let response = `📧 *Inbox for ${email}*\n\n`;
        for (const msg of data.email.slice(0, 5)) {
          response += `🔹 *From:* ${msg.from}\n*Subject:* ${msg.subject}\n---\n${msg.body?.substring(0, 200) || "No content"}\n---\n`;
        }
        response += `\n*Powered by SAMKIEL BOT*`;
        return await sendText(sock, chatId, response);
      }
    }
  } catch (e) {
    console.log("Checkmail: Tempmail.lol failed -", e.message);
  }

  await sendText(
    sock,
    chatId,
    "❌ Could not check inbox. Make sure you're using a valid email from the tempmail command.\n\n*Powered by SAMKIEL BOT*",
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

  // Try Guerrillamail read
  try {
    const { data } = await axios.get(
      `https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${id}`,
      { timeout: 15000, headers: HEADERS },
    );

    if (data?.mail_body) {
      const body = data.mail_body.replace(/<[^>]*>/g, "").substring(0, 1000); // Strip HTML
      return await sendText(
        sock,
        chatId,
        `📩 *Subject:* ${data.mail_subject || "No Subject"}\n*From:* ${data.mail_from || "Unknown"}\n\n${body}\n\n*Powered by SAMKIEL BOT*`,
      );
    }
  } catch (e) {
    console.log("Readmail: Guerrillamail failed -", e.message);
  }

  await sendText(
    sock,
    chatId,
    "❌ Could not read email.\n\n*Powered by SAMKIEL BOT*",
  );
}

module.exports = { tempmailCommand, checkmailCommand, readmailCommand };
