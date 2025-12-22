const fs = require("fs");
const path = require("path");
const { isOwner } = require("../lib/isOwner");
const { loadPrefix } = require("../lib/prefix");

const channelInfo = {
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363400862271383@newsletter",
      newsletterName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 ",
      serverMessageId: -1,
    },
  },
};

// Path to store auto status configuration
const configPath = path.join(__dirname, "../data/autoStatus.json");

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      enabled: false,
      reactOn: false,
      emoji: "👀",
      msgEnabled: false,
      msgContent: "Viewed by 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
    })
  );
} else {
  // Ensure new fields exist in current config
  try {
    const current = JSON.parse(fs.readFileSync(configPath));
    let updated = false;
    if (current.emoji === undefined) {
      current.emoji = "👀";
      updated = true;
    }
    if (current.msgEnabled === undefined) {
      current.msgEnabled = false;
      updated = true;
    }
    if (current.msgContent === undefined) {
      current.msgContent = "Viewed by 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";
      updated = true;
    }
    if (updated) fs.writeFileSync(configPath, JSON.stringify(current));
  } catch (e) {}
}

async function autoStatusCommand(sock, chatId, msg, args) {
  try {
    // Check if sender is owner
    const senderId = msg.key.participant || msg.key.remoteJid;
    const isOwnerCheck = await isOwner(senderId);
    if (!isOwnerCheck) {
      await sock.sendMessage(chatId, {
        text: "❌ This command can only be used by the owner!",
        ...channelInfo,
      });
      return;
    }

    // Read current config
    let config = JSON.parse(fs.readFileSync(configPath));

    // If no arguments, show current status
    if (!args || args.length === 0) {
      const status = config.enabled ? "enabled" : "disabled";
      const reactStatus = config.reactOn ? "enabled" : "disabled";
      const msgStatus = config.msgEnabled ? "enabled" : "disabled";
      const currentEmoji = config.emoji || "👀";
      const currentMsg = config.msgContent || "Viewed by 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";

      const currentPrefix = loadPrefix();
      const p = currentPrefix === "off" ? "" : currentPrefix;

      await sock.sendMessage(chatId, {
        text: `🔄 *Auto Status Settings*

📱 *Auto View:* ${status}
💫 *Reactions:* ${reactStatus} (${currentEmoji})
💬 *Reply Msg:* ${msgStatus}

*Current Preview:*
"${currentMsg}"

*Commands:*
${p}autostatus on/off
${p}autostatus react on/off
${p}autostatus msg on/off
${p}autostatus msg set <text>
${p}autostatus emoji on/off
${p}autostatus emoji set <emoji>`,
        ...channelInfo,
      });
      return;
    }

    // Handle on/off commands
    const command = args[0].toLowerCase();

    if (command === "on") {
      config.enabled = true;
      fs.writeFileSync(configPath, JSON.stringify(config));
      await sock.sendMessage(chatId, {
        text: "✅ Auto status view has been enabled!\nBot will now automatically view all contact statuses.",
        ...channelInfo,
      });
    } else if (command === "off") {
      config.enabled = false;
      fs.writeFileSync(configPath, JSON.stringify(config));
      await sock.sendMessage(chatId, {
        text: "❌ Auto status view has been disabled!\nBot will no longer automatically view statuses.",
        ...channelInfo,
      });
    } else if (command === "react") {
      // Handle react subcommand
      if (!args[1]) {
        const currentPrefix = loadPrefix();
        const p = currentPrefix === "off" ? "" : currentPrefix;
        await sock.sendMessage(chatId, {
          text: `❌ Please specify on/off for reactions!\nUse: ${p}autostatus react on/off`,
          ...channelInfo,
        });
        return;
      }

      const reactCommand = args[1].toLowerCase();
      if (reactCommand === "on") {
        config.reactOn = true;
        fs.writeFileSync(configPath, JSON.stringify(config));
        await sock.sendMessage(chatId, {
          text: "💫 Status reactions have been enabled!\nBot will now react to status updates.",
          ...channelInfo,
        });
      } else if (reactCommand === "off") {
        config.reactOn = false;
        fs.writeFileSync(configPath, JSON.stringify(config));
        await sock.sendMessage(chatId, {
          text: "❌ Status reactions have been disabled!\nBot will no longer react to status updates.",
          ...channelInfo,
        });
      } else {
        const currentPrefix = loadPrefix();
        const p = currentPrefix === "off" ? "" : currentPrefix;
        await sock.sendMessage(chatId, {
          text: `❌ Invalid reaction command! Use: ${p}autostatus react on/off`,
          ...channelInfo,
        });
      }
    } else if (command === "msg") {
      // Handle msg subcommand
      if (!args[1]) {
        const currentPrefix = loadPrefix();
        const p = currentPrefix === "off" ? "" : currentPrefix;
        await sock.sendMessage(chatId, {
          text: `❌ Please specify an action!\nUse:\n${p}autostatus msg on/off\n${p}autostatus msg set <text>`,
          ...channelInfo,
        });
        return;
      }

      const subCmd = args[1].toLowerCase();
      if (subCmd === "on") {
        config.msgEnabled = true;
        fs.writeFileSync(configPath, JSON.stringify(config));
        await sock.sendMessage(chatId, {
          text: "✅ Status reply messages enabled!",
          ...channelInfo,
        });
      } else if (subCmd === "off") {
        config.msgEnabled = false;
        fs.writeFileSync(configPath, JSON.stringify(config));
        await sock.sendMessage(chatId, {
          text: "❌ Status reply messages disabled!",
          ...channelInfo,
        });
      } else if (subCmd === "set") {
        const newMsg = args.slice(2).join(" ");
        if (!newMsg) {
          await sock.sendMessage(chatId, {
            text: "❌ Please provide text for the status reply message.",
            ...channelInfo,
          });
          return;
        }
        config.msgContent = newMsg;
        config.msgEnabled = true; // Auto-enable when setting
        fs.writeFileSync(configPath, JSON.stringify(config));
        await sock.sendMessage(chatId, {
          text: `✅ Status reply message updated to:\n"${newMsg}"`,
          ...channelInfo,
        });
      } else {
        await sock.sendMessage(chatId, {
          text: "❌ Invalid msg command.",
          ...channelInfo,
        });
      }
    } else if (command === "emoji") {
      // Handle emoji subcommand
      if (!args[1]) {
        const currentPrefix = loadPrefix();
        const p = currentPrefix === "off" ? "" : currentPrefix;
        await sock.sendMessage(chatId, {
          text: `❌ Please specify an action!\nUse:\n${p}autostatus emoji on/off\n${p}autostatus emoji set <emoji>`,
          ...channelInfo,
        });
        return;
      }

      const subCmd = args[1].toLowerCase();
      if (subCmd === "on") {
        config.reactOn = true;
        fs.writeFileSync(configPath, JSON.stringify(config));
        await sock.sendMessage(chatId, {
          text: "✅ Status reactions enabled!",
          ...channelInfo,
        });
      } else if (subCmd === "off") {
        config.reactOn = false;
        fs.writeFileSync(configPath, JSON.stringify(config));
        await sock.sendMessage(chatId, {
          text: "❌ Status reactions disabled!",
          ...channelInfo,
        });
      } else if (subCmd === "set") {
        const newEmoji = args[2];
        if (!newEmoji) {
          await sock.sendMessage(chatId, {
            text: "❌ Please provide an emoji.",
            ...channelInfo,
          });
          return;
        }
        config.emoji = newEmoji;
        config.reactOn = true; // Auto-enable when setting
        fs.writeFileSync(configPath, JSON.stringify(config));
        await sock.sendMessage(chatId, {
          text: `✅ Status reaction emoji set to: ${newEmoji}`,
          ...channelInfo,
        });
      } else {
        await sock.sendMessage(chatId, {
          text: "❌ Invalid emoji command.",
          ...channelInfo,
        });
      }
    } else {
      const currentPrefix = loadPrefix();
      const p = currentPrefix === "off" ? "" : currentPrefix;
      await sock.sendMessage(chatId, {
        text: `❌ Invalid command! Use:
${p}autostatus on/off
${p}autostatus react on/off
${p}autostatus msg on/off
${p}autostatus msg set <text>
${p}autostatus emoji on/off
${p}autostatus emoji set <emoji>`,
        ...channelInfo,
      });
    }
  } catch (error) {
    console.error("Error in autostatus command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Error occurred while managing auto status!\n" + error.message,
      ...channelInfo,
    });
  }
}

// Function to check if auto status is enabled
function isAutoStatusEnabled() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath));
    return config.enabled;
  } catch (error) {
    console.error("Error checking auto status config:", error);
    return false;
  }
}

// Function to check if status reactions are enabled
function isStatusReactionEnabled() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath));
    return config.reactOn;
  } catch (error) {
    console.error("Error checking status reaction config:", error);
    return false;
  }
}

// Function to react to status using proper method
async function reactToStatus(sock, statusKey) {
  try {
    if (!isStatusReactionEnabled()) {
      return;
    }

    // Use the proper relayMessage method for status reactions
    await sock.relayMessage(
      "status@broadcast",
      {
        reactionMessage: {
          key: {
            remoteJid: "status@broadcast",
            id: statusKey.id,
            participant: statusKey.participant || statusKey.remoteJid,
            fromMe: false,
          },
          text: "👀",
        },
      },
      {
        messageId: statusKey.id,
        statusJidList: [
          statusKey.remoteJid,
          statusKey.participant || statusKey.remoteJid,
        ],
      }
    );

    // Removed success log - only keep errors
  } catch (error) {
    console.error("❌ Error reacting to status:", error.message);
  }
}

// Function to handle status updates
async function handleStatusUpdate(sock, status) {
  try {
    if (!isAutoStatusEnabled()) {
      return;
    }

    // Add delay to prevent rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Handle status from messages.upsert
    if (status.messages && status.messages.length > 0) {
      const msg = status.messages[0];
      if (msg.key && msg.key.remoteJid === "status@broadcast") {
        try {
          await sock.readMessages([msg.key]);
          const sender = msg.key.participant || msg.key.remoteJid;

          // React to status if enabled
          await reactToStatus(sock, msg.key);

          // Removed success log - only keep errors
        } catch (err) {
          if (err.message?.includes("rate-overlimit")) {
            console.log("⚠️ Rate limit hit, waiting before retrying...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await sock.readMessages([msg.key]);
          } else {
            throw err;
          }
        }
        return;
      }
    }

    // Handle direct status updates
    if (status.key && status.key.remoteJid === "status@broadcast") {
      try {
        await sock.readMessages([status.key]);
        const sender = status.key.participant || status.key.remoteJid;

        // React to status if enabled
        await reactToStatus(sock, status.key);

        // Removed success log - only keep errors
      } catch (err) {
        if (err.message?.includes("rate-overlimit")) {
          console.log("⚠️ Rate limit hit, waiting before retrying...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await sock.readMessages([status.key]);
        } else {
          throw err;
        }
      }
      return;
    }

    // Handle status in reactions
    if (
      status.reaction &&
      status.reaction.key.remoteJid === "status@broadcast"
    ) {
      try {
        await sock.readMessages([status.reaction.key]);
        const sender =
          status.reaction.key.participant || status.reaction.key.remoteJid;

        // React to status if enabled
        await reactToStatus(sock, status.reaction.key);

        // Removed success log - only keep errors
      } catch (err) {
        if (err.message?.includes("rate-overlimit")) {
          console.log("⚠️ Rate limit hit, waiting before retrying...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await sock.readMessages([status.reaction.key]);
        } else {
          throw err;
        }
      }
      return;
    }
  } catch (error) {
    console.error("❌ Error in auto status view:", error.message);
  }
}

module.exports = {
  autoStatusCommand,
  handleStatusUpdate,
};
