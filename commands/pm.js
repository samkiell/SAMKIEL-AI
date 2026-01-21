const fs = require("fs");
const path = require("path");
const { sendText } = require("../lib/sendResponse");
const { isOwner } = require("../lib/isOwner");

const PM_CONFIG_PATH = path.join(__dirname, "../data/pmConfig.json");

function loadPMConfig() {
  if (!fs.existsSync(PM_CONFIG_PATH)) {
    const defaultConfig = {
      enabled: true,
      message:
        "I'm your AI assistant — ready to help you with commands, tools, and automation.",
    };
    fs.writeFileSync(PM_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  try {
    return JSON.parse(fs.readFileSync(PM_CONFIG_PATH, "utf8"));
  } catch (e) {
    return { enabled: true, message: "" };
  }
}

async function pmCommand(sock, chatId, senderId, message, args) {
  // Owner check is handled centrally in main.js
  const subcmd = args[0]?.toLowerCase();
  const config = loadPMConfig();

  if (!subcmd) {
    return await sendText(
      sock,
      chatId,
      `*PM GREETING CONFIG*\n\nStatus: ${config.enabled ? "✅ ON" : "❌ OFF"}\nMessage: ${config.message}\n\n*Usage:*\n.pm on - Enable greeting\n.pm off - Disable greeting\n.pm set <text> - Set custom greeting text`,
      { quoted: message },
    );
  }

  if (subcmd === "on") {
    config.enabled = true;
    fs.writeFileSync(PM_CONFIG_PATH, JSON.stringify(config, null, 2));
    return await sendText(sock, chatId, "✅ PM Greeting enabled!", {
      quoted: message,
    });
  }

  if (subcmd === "off") {
    config.enabled = false;
    fs.writeFileSync(PM_CONFIG_PATH, JSON.stringify(config, null, 2));
    return await sendText(sock, chatId, "❌ PM Greeting disabled!", {
      quoted: message,
    });
  }

  if (subcmd === "set") {
    const newMessage = args.slice(1).join(" ");
    if (!newMessage)
      return await sendText(
        sock,
        chatId,
        "❌ Please provide the message text.",
        {
          quoted: message,
        },
      );
    config.message = newMessage;
    fs.writeFileSync(PM_CONFIG_PATH, JSON.stringify(config, null, 2));
    return await sendText(sock, chatId, "✅ PM Greeting message updated!", {
      quoted: message,
    });
  }

  return await sendText(
    sock,
    chatId,
    "❌ Invalid sub-command. Use: on, off, or set.",
    {
      quoted: message,
    },
  );
}

module.exports = pmCommand;
