// Main logic of the bot

const {
  addPremium,
  removePremium,
  loadPremium,
  isPremium,
} = require("./lib/premium");

const videoCommand = require("./commands/video");
const settings = require("./settings");
require("./config.js");
const { isBanned } = require("./lib/isBanned");
const { isOwner, isSuperOwner } = require("./lib/isOwner");
const { handleAutoStatus } = require("./lib/statusViewer");
const { isBotDisabled } = require("./lib/botState");
const {
  loadPrefix,
  savePrefix,
  isCommand,
  getCommand,
  VALID_COMMANDS,
} = require("./lib/prefix");
const yts = require("yt-search");
const { fetchBuffer } = require("./lib/myfunc");
const fs = require("fs");
const fetch = require("node-fetch");
const ytdl = require("ytdl-core");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const {
  addWelcome,
  delWelcome,
  isWelcomeOn,
  addGoodbye,
  delGoodBye,
  isGoodByeOn,
  isSudo,
} = require("./lib/index");

// Command imports
const tagAllCommand = require("./commands/tagall");
const helpCommand = require("./commands/help");
const banCommand = require("./commands/ban");
const { promoteCommand } = require("./commands/promote");
const { demoteCommand } = require("./commands/demote");
const muteCommand = require("./commands/mute");
const unmuteCommand = require("./commands/unmute");
const stickerCommand = require("./commands/sticker");
const isAdmin = require("./lib/isAdmin");
const warnCommand = require("./commands/warn");
const warningsCommand = require("./commands/warnings");
const ttsCommand = require("./commands/tts");
const {
  tictactoeCommand,
  handleTicTacToeMove,
} = require("./commands/tictactoe");
const { incrementMessageCount, topMembers } = require("./commands/topmembers");
const ownerCommand = require("./commands/owner");
const deleteCommand = require("./commands/delete");
const {
  handleAntilinkCommand,
  handleLinkDetection,
} = require("./commands/antilink");
const { Antilink } = require("./lib/antilink");
const memeCommand = require("./commands/meme");
const tagCommand = require("./commands/tag");
const jokeCommand = require("./commands/joke");
const quoteCommand = require("./commands/quote");
const factCommand = require("./commands/fact");
const weatherCommand = require("./commands/weather");
const newsCommand = require("./commands/news");
const kickCommand = require("./commands/kick");
const simageCommand = require("./commands/simage");
const attpCommand = require("./commands/attp");
const { startHangman, guessLetter } = require("./commands/hangman");
const { startTrivia, answerTrivia } = require("./commands/trivia");
const { complimentCommand } = require("./commands/compliment");
const { insultCommand } = require("./commands/insult");
const { eightBallCommand } = require("./commands/eightball");
const { lyricsCommand } = require("./commands/lyrics");
const { dareCommand } = require("./commands/dare");
const { truthCommand } = require("./commands/truth");
const { clearCommand } = require("./commands/clear");
const pingCommand = require("./commands/ping");
const aliveCommand = require("./commands/alive");
const blurCommand = require("./commands/img-blur");
const welcomeCommand = require("./commands/welcome");
const goodbyeCommand = require("./commands/goodbye");
const githubCommand = require("./commands/github");
const {
  handleAntiBadwordCommand,
  handleBadwordDetection,
} = require("./lib/antibadword");
const antibadwordCommand = require("./commands/antibadword");
const {
  handleChatbotCommand,
  handleChatbotResponse,
} = require("./commands/chatbot");
const takeCommand = require("./commands/take");
const { flirtCommand } = require("./commands/flirt");
const characterCommand = require("./commands/character");
const wastedCommand = require("./commands/wasted");
const shipCommand = require("./commands/ship");
const groupInfoCommand = require("./commands/groupinfo");
const resetlinkCommand = require("./commands/resetlink");
const staffCommand = require("./commands/staff");
const unbanCommand = require("./commands/unban");
const emojimixCommand = require("./commands/emojimix");
const { handlePromotionEvent } = require("./commands/promote");
const { handleDemotionEvent } = require("./commands/demote");
const viewOnceCommand = require("./commands/viewonce");
const clearSessionCommand = require("./commands/clearsession");
const {
  autoStatusCommand,
  handleStatusUpdate,
} = require("./commands/autostatus");
const { stupidCommand } = require("./commands/stupid");
const pairCommand = require("./commands/pair");
const stickerTelegramCommand = require("./commands/stickertelegram");
const textmakerCommand = require("./commands/textmaker");
const {
  handleAntideleteCommand,
  handleMessageRevocation,
  storeMessage,
} = require("./commands/antidelete");
const clearTmpCommand = require("./commands/cleartmp");
const setProfilePicture = require("./commands/setpp");
const instagramCommand = require("./commands/instagram");
const facebookCommand = require("./commands/facebook");
const playCommand = require("./commands/play");
const tiktokCommand = require("./commands/tiktok");
const songCommand = require("./commands/song");
const aiCommand = require("./commands/ai");
const { handleTranslateCommand } = require("./commands/translate");
const { handleSsCommand } = require("./commands/ss");
const {
  addCommandReaction,
  handleAreactCommand,
  autoReactToNonCommand,
} = require("./lib/reactions");
const { goodnightCommand } = require("./commands/goodnight");
const { shayariCommand } = require("./commands/shayari");
const { rosedayCommand } = require("./commands/roseday");
const imagineCommand = require("./commands/imagine");
const { reminiCommand } = require("./commands/remini");
const {
  setGroupDescription,
  setGroupName,
  setGroupPhoto,
} = require("./commands/groupmanage");
const removebg = require("./commands/removebg");
const updateCommand = require("./commands/update");
const settingsCommand = require("./commands/settings");
const { vcfCommand } = require("./commands/vcf");
const soraCommand = require("./commands/sora");
const sudoCommand = require("./commands/sudo");
const lidCommand = require("./commands/lid");
const { addXp } = require("./lib/leveling");
const rankCommand = require("./commands/rank");
const leaderboardCommand = require("./commands/leaderboard");
const panelCommand = require("./commands/admin");
const addPremCommand = require("./commands/addprem");
const delPremCommand = require("./commands/delprem");
const rankToggleCommand = require("./commands/ranktoggle");
const { isRankEnabled } = require("./lib/rankConfig");
const handleBotControl = require("./commands/botControl");
const prefixCommand = require("./commands/prefix");

// Global settings
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = "https://whatsapp.com/channel/0029VbAhWo3C6Zvf2t4Rne0h";
global.ytch = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";

// Add this near the top of main.js with other global configurations
const channelInfo = {
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363400862271383@newsletter",
      newsletterName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
      serverMessageId: -1,
    },
  },
};
const { jidNormalizedUser } = require("@whiskeysockets/baileys");
const ownerData = JSON.parse(fs.readFileSync("./data/owner.json"));
const rawOwners = [
  ...(Array.isArray(ownerData.superOwner)
    ? ownerData.superOwner
    : [ownerData.superOwner]),
  ...(Array.isArray(ownerData.owners)
    ? ownerData.owners.map((o) => o.number)
    : []),
].filter(Boolean);

const ownerList = rawOwners.map((j) =>
  jidNormalizedUser(`${j}@s.whatsapp.net`)
);

async function handleMessages(sock, messageUpdate, printLog) {
  let chatId;
  try {
    const { messages, type } = messageUpdate;
    if (type !== "notify") return;

    const message = messages[0];
    if (!message?.message) return;

    // ===== BEGIN: Automatic reply wrapper =====
    const incomingMessage = message; // keep local reference to quote

    // Preserve original sendMessage for restoration later
    const originalSendMessage = sock.sendMessage;

    // Override sendMessage for this specific incoming message
    sock.sendMessage = async function (jid, content, options) {
      try {
        // Ensure options exists
        if (!options || typeof options !== "object") options = {};

        // If no quoted message provided, attach the triggering one
        if (!options.quoted) {
          options.quoted = incomingMessage;
        }

        // Execute original sendMessage with proper binding
        return await originalSendMessage.call(this, jid, content, options);
      } catch (err) {
        console.error("sendMessage wrapper error:", err);
        return await originalSendMessage.call(this, jid, content, options);
      }
    };
    // ===== END: Automatic reply wrapper =====

    // Store message for antidelete feature
    if (message.message) {
      storeMessage(message);
    }

    // Handle message revocation
    if (message.message?.protocolMessage?.type === 0) {
      await handleMessageRevocation(sock, message);
      return;
    }

    chatId = message.key.remoteJid;
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith("@g.us");
    const isSudoUser = await isSudo(senderId);

    // Initialize admin status variables
    let isSenderAdmin = false;
    let isBotAdmin = false;
    if (isGroup) {
      const adminStatus = await isAdmin(sock, chatId, senderId);
      isSenderAdmin = adminStatus.isSenderAdmin;
      isBotAdmin = adminStatus.isBotAdmin;
    }

    let userMessage =
      message.message?.conversation?.trim() ||
      message.message?.extendedTextMessage?.text?.trim() ||
      message.message?.listResponseMessage?.singleSelectReply?.selectedRowId?.trim() ||
      message.message?.buttonsResponseMessage?.selectedButtonId?.trim() ||
      "";

    // Initialize dynamic prefix helper
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    // Get command without prefix
    const command = getCommand(userMessage);

    // Only log command usage
    if (isCommand(userMessage)) {
      if (VALID_COMMANDS.includes(command)) {
        console.log(
          `📝 Command used in ${isGroup ? "group" : "private"}: ${userMessage}`
        );
        // Set recording state for commands
        try {
          await sock.sendPresenceUpdate("recording", chatId);
          // Global command reaction
          await addCommandReaction(sock, message, command);
        } catch (e) {}
      }
    }

    // Check if bot is disabled in this chat
    const isOwnerCheck = (await isOwner(senderId)) || message.key.fromMe;
    if (isBotDisabled(chatId) && command !== "enablebot" && !isOwnerCheck) {
      return;
    }
    if (isBanned(senderId) && command !== "unban") {
      // Only respond occasionally to avoid spam
      if (Math.random() < 0.1) {
        await sock.sendMessage(chatId, {
          text: "❌ You are banned from using the bot. Contact an admin to get unbanned.",
          ...channelInfo,
        });
      }
      return;
    }

    // Check Mode (Public/Private)
    let modeData;
    try {
      if (!fs.existsSync("./data/mode.json")) {
        fs.writeFileSync(
          "./data/mode.json",
          JSON.stringify({ isPublic: true })
        );
      }
      modeData = JSON.parse(fs.readFileSync("./data/mode.json"));
    } catch {
      modeData = { isPublic: true };
    }

    // Enforce Private Mode
    if (
      !modeData.isPublic &&
      !message.key.fromMe &&
      !(await isOwner(senderId))
    ) {
      return;
    }

    // First check if it's a game move
    if (
      /^[1-9]$/.test(userMessage) ||
      userMessage.toLowerCase() === "surrender"
    ) {
      await handleTicTacToeMove(sock, chatId, senderId, userMessage);
      return;
    }

    // Basic message response in private chat (confirmed compatible with nstar-y/bail)
    if (
      !isGroup &&
      ["hi", "hello", "ezekiel", "bot", "samkiel", "hey", "bro"].includes(
        userMessage.toLowerCase()
      )
    ) {
      await sock.sendMessage(chatId, {
        text: `👋 Hi there! I'm *${settings.botName || "SAMKIEL AI"}*.

I'm your AI assistant — ready to help you with commands, tools, and automation.

You can explore all available commands below 👇`,
        footer: "Made with 🤍 by ѕαмкιєℓ.∂єν",
        templateButtons: [
          {
            index: 1,
            urlButton: {
              displayText: "🌐 Visit Website",
              url: "https://samkiel.dev",
            },
          },
          {
            index: 2,
            urlButton: {
              displayText: "📣 WhatsApp Channel",
              url: "https://whatsapp.com/channel/0029VbAhWo3C6Zvf2t4Rne0h",
            },
          },
          {
            index: 3,
            urlButton: {
              displayText: "💻 GitHub Profile",
              url: "https://github.com/samkiel488",
            },
          },
          {
            index: 4,
            urlButton: {
              displayText: "🔗 LinkedIn",
              url: "https://www.linkedin.com/in/samkiel",
            },
          },
          {
            index: 5,
            quickReplyButton: {
              displayText: "📜 Open Menu",
              id: ".menu",
            },
          },
        ],
      });
      return;
    }

    if (!message.key.fromMe) {
      incrementMessageCount(chatId, senderId);

      // Add XP and check for level up (if enabled)
      if (isRankEnabled(chatId)) {
        const { levelUp, level } = addXp(senderId);
        if (levelUp && !isGroup) {
          // Only notify level up in private to reduce spam, or maybe public if configured. Let's do private notification if in a group? No, usually public is fun.
          // Let's stick to simple "private" logic or just send it:
          await sock.sendMessage(chatId, {
            text: `🎉 *Level Up!* 🎉\n\nCongratulations @${
              senderId.split("@")[0]
            }! You've reached *Level ${level}*! 🛡️`,
            mentions: [senderId],
            ...channelInfo,
          });
        } else if (levelUp && isGroup) {
          await sock.sendMessage(chatId, {
            text: `🎉 *Level Up!* 🎉\n\nCongratulations @${
              senderId.split("@")[0]
            }! You've reached *Level ${level}*! 🛡️`,
            mentions: [senderId],
            ...channelInfo,
          });
        }
      }
    }

    // Check for bad words FIRST, before ANY other processing
    if (isGroup && userMessage) {
      await handleBadwordDetection(
        sock,
        chatId,
        message,
        userMessage,
        senderId
      );
    }

    // Then check for command prefix
    if (!isCommand(userMessage)) {
      if (isGroup) {
        // Process non-command messages first
        await handleChatbotResponse(
          sock,
          chatId,
          message,
          userMessage,
          senderId
        );
        await Antilink(message, sock);
        // Auto-react to non-command messages if enabled
        await autoReactToNonCommand(sock, message);
      }
    }

    // Add delay for commands except specified ones
    const noDelayCommands = ["ping", "menu", "help", "bot", "list", "leap"];
    if (
      isCommand(userMessage) &&
      !noDelayCommands.some((c) => command.startsWith(c))
    ) {
      const delayMs = isGroup ? 2000 : 5000;
      try {
        await sock.sendPresenceUpdate("recording", chatId);
      } catch (e) {}
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      try {
        await sock.sendPresenceUpdate("paused", chatId);
      } catch (e) {}
    }

    // Define command categories
    const adminOnlyCommands = [
      "mute",
      "unmute",
      "ban",
      "unban",
      "promote",
      "demote",
      "kick",
      "tagall",
      "antilink",
    ];
    const ownerOnlyCommands = [
      "mode",
      "autostatus",
      "antidelete",
      "cleartmp",
      "setpp",
      "clearsession",
      "areact",
      "autoreact",
      "setprefix",
      "disablebot",
      "enablebot",
    ];
    const hybridCommands = ["welcome", "goodbye", "chatbot"];

    const isAdminOnlyCommand = adminOnlyCommands.some((cmd) =>
      command.startsWith(cmd)
    );
    const isOwnerOnlyCommand = ownerOnlyCommands.some((cmd) =>
      command.startsWith(cmd)
    );
    const isHybridCommand = hybridCommands.some((cmd) =>
      command.startsWith(cmd)
    );

    const superOwnerCheck = isSuperOwner(senderId);

    // Admin-only commands: Require admin status (bypass for superOwner)
    if (isGroup && isAdminOnlyCommand && !superOwnerCheck) {
      const { isSenderAdmin, isBotAdmin } = await isAdmin(
        sock,
        chatId,
        senderId
      );

      if (!isBotAdmin) {
        await sock.sendMessage(chatId, {
          text: "Buddy you have to make me Admin to use that command.",
          ...channelInfo,
        });
        return;
      }

      if (!isSenderAdmin) {
        await sock.sendMessage(chatId, {
          text: "Buddy only group admins can use this command.",
          ...channelInfo,
        });
        return;
      }
    }

    // Owner-only commands: Require owner only (superOwner is already an owner)
    if (isOwnerOnlyCommand) {
      const isOwnerCheck = (await isOwner(senderId)) || message.key.fromMe;
      if (!isOwnerCheck) {
        await sock.sendMessage(chatId, {
          text: "❌ Sorry buddy this command can only be used by Ԇ・SAMKIEL.",
          ...channelInfo,
        });
        return;
      }
    }

    // Hybrid commands: Allow both admins and owner
    if (isGroup && isHybridCommand) {
      const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
      const isOwnerCheck = await isOwner(senderId);
      if (!isSenderAdmin && !isOwnerCheck && !message.key.fromMe) {
        await sock.sendMessage(chatId, {
          text: "Buddy only group admins or bot owner can use this command.",
          ...channelInfo,
        });
        return;
      }
    }

    // Premium Command enforcement
    const premiumCommands = [
      "gpt",
      "gemini",
      "imagine",
      "remini",
      "sora",
      "removebg",
      "upgrade",
    ];

    const isPremiumCmd = premiumCommands.includes(command);
    if (isPremiumCmd) {
      let isPrem = isPremium(senderId);
      const isCreator = await isOwner(senderId);

      // If not premium (by direct ID match) and not creator, but is an LID in a group:
      // Try to resolve the LID to a Phone JID using group metadata
      if (!isPrem && !isCreator && senderId.endsWith("@lid") && isGroup) {
        try {
          const groupMetadata = await sock.groupMetadata(chatId);
          const participant = groupMetadata.participants.find(
            (p) => p.lid === senderId
          );
          if (participant && participant.id) {
            isPrem = isPremium(participant.id);
          }
        } catch (e) {
          console.error("Failed to resolve LID for premium check:", e);
        }
      }

      if (!isPrem && !isCreator) {
        const vcard =
          "BEGIN:VCARD\n" +
          "VERSION:3.0\n" +
          "FN:Samkiel\n" +
          "TEL;type=CELL;type=VOICE;waid=2348087357158:2348087357158\n" +
          "END:VCARD";

        await sock.sendMessage(chatId, {
          text: "This command is available only for Premium users.\nTo upgrade, contact Samkiel using the contact card below.",
          ...channelInfo,
        });

        await sock.sendMessage(chatId, {
          contacts: {
            displayName: "Samkiel",
            contacts: [{ vcard }],
          },
        });
        return;
      }
    }

    // Command handlers
    switch (true) {
      case command === "upgrade":
        await sock.sendMessage(chatId, {
          text: "You are already a premium user.",
          ...channelInfo,
        });
        break;
      case command === "simage": {
        const quotedMessage =
          message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage?.stickerMessage) {
          await simageCommand(sock, quotedMessage, chatId);
        } else {
          await sendWithRecording(sock, chatId, {
            text: "Please reply to a sticker with the simage command to convert it.",
            ...channelInfo,
          });
        }
        break;
      }
      case command.startsWith("kick"):
        const mentionedJidListKick =
          message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        await kickCommand(
          sock,
          chatId,
          senderId,
          mentionedJidListKick,
          message
        );
        break;
      case command.startsWith("mute"):
        const muteDuration = parseInt(command.split(" ")[1]);
        if (isNaN(muteDuration)) {
          await sock.sendMessage(chatId, {
            text: "Please provide a valid number of minutes.\neg to mute 10 minutes\nmute 10",
            ...channelInfo,
          });
        } else {
          await muteCommand(sock, chatId, senderId, muteDuration);
        }
        break;
      case command === "unmute":
        await unmuteCommand(sock, chatId, senderId);
        break;
      case command.startsWith("ban"):
        await banCommand(sock, chatId, message);
        break;
      case command.startsWith("unban"):
        await unbanCommand(sock, chatId, message);
        break;
      case command === "update":
        await updateCommand(sock, chatId, message);
        break;
      case command === "help" ||
        command === "menu" ||
        command === "bot" ||
        command === "list":
        await helpCommand(sock, chatId, senderId);
        break;
      case command === "sticker" || command === "s":
        await stickerCommand(sock, chatId, message);
        break;
      case command.startsWith("warnings"):
        const mentionedJidListWarnings =
          message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        await warningsCommand(sock, chatId, mentionedJidListWarnings);
        break;
      case command.startsWith("warn"):
        const mentionedJidListWarn =
          message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        await warnCommand(
          sock,
          chatId,
          senderId,
          mentionedJidListWarn,
          message
        );
        break;
      case command.startsWith("tts"):
        const text = command.slice(3).trim();
        await ttsCommand(sock, chatId, text);
        break;
      case command === "delete" || command === "del":
        await deleteCommand(sock, chatId, message, senderId);
        break;
      case command.startsWith("attp"):
        await attpCommand(sock, chatId, message);
        break;
      case command.startsWith("mode"):
        // The owner check is already done above in the ownerOnlyCommands block
        // Read current data first
        let modeData;
        try {
          if (!fs.existsSync("./data/mode.json")) {
            fs.writeFileSync(
              "./data/mode.json",
              JSON.stringify({ isPublic: true })
            );
          }
          modeData = JSON.parse(fs.readFileSync("./data/mode.json"));
        } catch (error) {
          console.error("Error reading access mode:", error);
          await sock.sendMessage(chatId, {
            text: "Failed to read bot mode status",
            ...channelInfo,
          });
          return;
        }

        const action = command.split(" ")[1]?.toLowerCase();
        // If no argument provided, show current status
        if (!action) {
          const currentMode = modeData.isPublic ? "public" : "private";
          await sock.sendMessage(chatId, {
            text: `Current bot mode: *${currentMode}*\n\nUsage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only`,
            ...channelInfo,
          });
          return;
        }

        if (action !== "public" && action !== "private") {
          await sock.sendMessage(chatId, {
            text: `Usage: ${p}mode public/private\n\nExample:\n${p}mode public - Allow everyone to use bot\n${p}mode private - Restrict to owner only`,
            ...channelInfo,
          });
          return;
        }

        try {
          // Update access mode
          modeData.isPublic = action === "public";

          // Save updated data
          fs.writeFileSync(
            "./data/mode.json",
            JSON.stringify(modeData, null, 2)
          );

          await sock.sendMessage(chatId, {
            text: `Bot is now in *${action}* mode`,
            ...channelInfo,
          });
        } catch (error) {
          console.error("Error updating access mode:", error);
          await sock.sendMessage(chatId, {
            text: "Failed to update bot access mode",
            ...channelInfo,
          });
        }
        break;
      case command === "rankon" || command === "rankoff":
        // Use await isOwner(senderId) since isOwner is async and used elsewhere like that
        await rankToggleCommand(
          sock,
          chatId,
          isGroup,
          command,
          isSenderAdmin,
          await isOwner(senderId)
        );
        break;
      case command === "owner":
        await ownerCommand(sock, chatId);
        break;

      case command === "disablebot" || command === "enablebot":
        await handleBotControl(
          sock,
          chatId,
          senderId,
          command,
          message,
          channelInfo
        );
        break;
      case command === "vcf": {
        if (!isGroup) {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups!",
          });
          return;
        }
        // Check if sender is admin or owner
        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
        const isOwnerCheck = await isOwner(senderId);
        if (!isSenderAdmin && !isOwnerCheck) {
          await sock.sendMessage(chatId, {
            text: "Only group admins or bot owner can use this command.",
          });
          return;
        }
        await vcfCommand(sock, chatId);
        break;
      }

      case command === "tagall":
        if (isGroup) {
          const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
          if (isSenderAdmin || message.key.fromMe) {
            await tagAllCommand(sock, chatId, senderId);
          } else {
            await sock.sendMessage(chatId, {
              text: "Sorry, only group admins can use the .tagall command.",
              ...channelInfo,
            });
          }
        } else {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups.",
            ...channelInfo,
          });
        }
        break;
      case command.startsWith("tag"):
        const messageText = rawText.slice(4).trim(); // use rawText here, not userMessage
        const replyMessage =
          message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
          null;
        await tagCommand(sock, chatId, senderId, messageText, replyMessage);
        break;
      case command.startsWith("antilink"):
        if (!isGroup) {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups.",
            ...channelInfo,
          });
          return;
        }
        if (!isBotAdmin) {
          await sock.sendMessage(chatId, {
            text: "Please make the bot an admin first.",
            ...channelInfo,
          });
          return;
        }
        await handleAntilinkCommand(
          sock,
          chatId,
          userMessage,
          senderId,
          isSenderAdmin
        );
        break;
      case command === "meme":
        await memeCommand(sock, chatId);
        break;
      case command.startsWith("joke"):
        await jokeCommand(sock, chatId, message);
        break;
      case command === "quote":
        await quoteCommand(sock, chatId);
        break;
      case command === "fact":
        await factCommand(sock, chatId);
        break;
      case command.startsWith("weather"):
        const city = command.slice(7).trim();
        if (city) {
          await weatherCommand(sock, chatId, city);
        } else {
          await sock.sendMessage(chatId, {
            text: "Please specify a city, e.g., .weather Kaduna",
            ...channelInfo,
          });
        }
        break;
      case command === "news":
        await newsCommand(sock, chatId);
        break;
      case command.startsWith("ttt") || command.startsWith("tictactoe"):
        const tttText = command.split(" ").slice(1).join(" ");
        await tictactoeCommand(sock, chatId, senderId, tttText);
        break;
      case command.startsWith("move"):
        const position = parseInt(command.split(" ")[1]);
        if (isNaN(position)) {
          await sock.sendMessage(chatId, {
            text: "Please provide a valid position number for Tic-Tac-Toe move.",
            ...channelInfo,
          });
        } else {
          tictactoeMove(sock, chatId, senderId, position);
        }
        break;
      case command === "topmembers":
        topMembers(sock, chatId, isGroup);
        break;
      case command.startsWith("hangman"):
        startHangman(sock, chatId);
        break;
      case command.startsWith("guess"):
        const guessedLetter = command.split(" ")[1];
        if (guessedLetter) {
          guessLetter(sock, chatId, guessedLetter);
        } else {
          sock.sendMessage(chatId, {
            text: "Please guess a letter using .guess <letter>",
            ...channelInfo,
          });
        }
        break;
      case command.startsWith("trivia"):
        startTrivia(sock, chatId);
        break;
      case command.startsWith("answer"):
        const answer = command.split(" ").slice(1).join(" ");
        if (answer) {
          answerTrivia(sock, chatId, answer);
        } else {
          sock.sendMessage(chatId, {
            text: "Please provide an answer using .answer <answer>",
            ...channelInfo,
          });
        }
        break;
      case command.startsWith("compliment"):
        await complimentCommand(sock, chatId, message);
        break;
      case command.startsWith("insult"):
        await insultCommand(sock, chatId, message);
        break;
      case command === "rank":
        await rankCommand(sock, chatId, message);
        break;
      case command === "leaderboard" || command === "top":
        await leaderboardCommand(sock, chatId);
        break;
      case command.startsWith("8ball"):
        const question = command.split(" ").slice(1).join(" ");
        await eightBallCommand(sock, chatId, question);
        break;
      case command.startsWith("lyrics"):
        const songTitle = command.split(" ").slice(1).join(" ");
        await lyricsCommand(sock, chatId, songTitle, message);
        break;
      case command.startsWith("stupid") ||
        command.startsWith("itssostupid") ||
        command.startsWith("iss"):
        const stupidQuotedMsg =
          message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const stupidMentionedJid =
          message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const stupidArgs = command.split(" ").slice(1);
        await stupidCommand(
          sock,
          chatId,
          stupidQuotedMsg,
          stupidMentionedJid,
          senderId,
          stupidArgs
        );
        break;
      case command === "dare":
        await dareCommand(sock, chatId);
        break;
      case command === "truth":
        await truthCommand(sock, chatId);
        break;
      case command === "clear":
        if (isGroup) await clearCommand(sock, chatId);
        break;
      case command.startsWith("promote"):
        const mentionedJidListPromote =
          message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        await promoteCommand(sock, chatId, mentionedJidListPromote, message);
        break;
      case command.startsWith("demote"):
        const mentionedJidListDemote =
          message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        await demoteCommand(sock, chatId, mentionedJidListDemote, message);
        break;
      case command === "ping":
        await pingCommand(sock, chatId, message);
        break;
      case command === "alive":
        await aliveCommand(sock, chatId, message);
        break;
      case command.startsWith("blur"):
        const quotedMessage =
          message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        await blurCommand(sock, chatId, message, quotedMessage);
        break;
      case command.startsWith("welcome"):
        if (isGroup) {
          // Check admin status if not already checked
          if (!isSenderAdmin) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
          }

          if (isSenderAdmin || message.key.fromMe) {
            await welcomeCommand(sock, chatId, message);
          } else {
            await sock.sendMessage(chatId, {
              text: "Sorry, only group admins can use this command.",
              ...channelInfo,
            });
          }
        } else {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups.",
            ...channelInfo,
          });
        }
        break;
      case command.startsWith("goodbye"):
        if (isGroup) {
          // Check admin status if not already checked
          if (!isSenderAdmin) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
          }

          if (isSenderAdmin || message.key.fromMe) {
            await goodbyeCommand(sock, chatId, message);
          } else {
            await sock.sendMessage(chatId, {
              text: "Sorry, only group admins can use this command.",
              ...channelInfo,
            });
          }
        } else {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups.",
            ...channelInfo,
          });
        }
        break;
      case command === "git":
      case command === "github":
      case command === "sc":
      case command === "script":
      case command === "repo":
        await githubCommand(sock, chatId);
        break;
      case command.startsWith("antibadword"):
        if (!isGroup) {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups.",
            ...channelInfo,
          });
          return;
        }

        const adminStatus = await isAdmin(sock, chatId, senderId);
        isSenderAdmin = adminStatus.isSenderAdmin;
        isBotAdmin = adminStatus.isBotAdmin;

        if (!isBotAdmin) {
          await sock.sendMessage(chatId, {
            text: "*Bot must be admin to use this feature*",
            ...channelInfo,
          });
          return;
        }

        await antibadwordCommand(
          sock,
          chatId,
          message,
          senderId,
          isSenderAdmin
        );
        break;
      case command.startsWith("chatbot"):
        if (!isGroup) {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups.",
            ...channelInfo,
          });
          return;
        }

        // Check if sender is admin or bot owner
        const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
        if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe) {
          await sock.sendMessage(chatId, {
            text: "*Only admins or bot owner can use this command*",
            ...channelInfo,
          });
          return;
        }

        const match = command.slice(7).trim();
        await handleChatbotCommand(sock, chatId, message, match);
        break;
      case command.startsWith("take"):
        const takeArgs = command.slice(4).trim().split(" ");
        await takeCommand(sock, chatId, message, takeArgs);
        break;
      case command === "flirt":
        await flirtCommand(sock, chatId);
        break;
      case command.startsWith("character"):
        await characterCommand(sock, chatId, message);
        break;
      case command.startsWith("waste"):
        await wastedCommand(sock, chatId, message);
        break;
      case command === "ship":
        if (!isGroup) {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups!",
            ...channelInfo,
          });
          return;
        }
        await shipCommand(sock, chatId, message);
        break;
      case command === "groupinfo" ||
        command === "infogp" ||
        command === "infogrupo":
        if (!isGroup) {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups!",
            ...channelInfo,
          });
          return;
        }
        await groupInfoCommand(sock, chatId, message);
        break;
      case command === "resetlink" ||
        command === "revoke" ||
        command === "anularlink":
        if (!isGroup) {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups!",
            ...channelInfo,
          });
          return;
        }
        await resetlinkCommand(sock, chatId, senderId);
        break;
      case command === "staff" ||
        command === "admins" ||
        command === "listadmin":
        if (!isGroup) {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups!",
            ...channelInfo,
          });
          return;
        }
        await staffCommand(sock, chatId, message);
        break;
      case command.startsWith("emojimix") || command.startsWith("emix"):
        await emojimixCommand(sock, chatId, message);
        break;
      case command.startsWith("tg") ||
        command.startsWith("stickertelegram") ||
        command.startsWith("tgsticker") ||
        command.startsWith("telesticker"):
        await stickerTelegramCommand(sock, chatId, message);
        break;

      case command === "deyplay":
        await viewOnceCommand(sock, chatId, message);
        break;
      case command === "clearsession" || command === "clearsesi":
        await clearSessionCommand(sock, chatId, message);
        break;
      case command.startsWith("autostatus"):
        const autoStatusArgs = command.split(" ").slice(1);
        await autoStatusCommand(sock, chatId, message, autoStatusArgs);
        break;
      case command.startsWith("pair") || command.startsWith("rent"): {
        const q = command.split(" ").slice(1).join(" ");
        await pairCommand(sock, chatId, message, q);
        break;
      }
      case command.startsWith("metallic"):
        await textmakerCommand(sock, chatId, message, command, "metallic");
        break;
      case command.startsWith("ice"):
        await textmakerCommand(sock, chatId, message, command, "ice");
        break;
      case command.startsWith("snow"):
        await textmakerCommand(sock, chatId, message, command, "snow");
        break;
      case command.startsWith("impressive"):
        await textmakerCommand(sock, chatId, message, command, "impressive");
        break;
      case command.startsWith("matrix"):
        await textmakerCommand(sock, chatId, message, command, "matrix");
        break;
      case command.startsWith("light"):
        await textmakerCommand(sock, chatId, message, command, "light");
        break;
      case command.startsWith("neon"):
        await textmakerCommand(sock, chatId, message, command, "neon");
        break;
      case command.startsWith("devil"):
        await textmakerCommand(sock, chatId, message, command, "devil");
        break;
      case command.startsWith("purple"):
        await textmakerCommand(sock, chatId, message, command, "purple");
        break;
      case command.startsWith("thunder"):
        await textmakerCommand(sock, chatId, message, command, "thunder");
        break;
      case command.startsWith("leaves"):
        await textmakerCommand(sock, chatId, message, command, "leaves");
        break;
      case command.startsWith("1917"):
        await textmakerCommand(sock, chatId, message, command, "1917");
        break;
      case command.startsWith("arena"):
        await textmakerCommand(sock, chatId, message, command, "arena");
        break;
      case command.startsWith("hacker"):
        await textmakerCommand(sock, chatId, message, command, "hacker");
        break;
      case command.startsWith("sand"):
        await textmakerCommand(sock, chatId, message, command, "sand");
        break;
      case command.startsWith("blackpink"):
        await textmakerCommand(sock, chatId, message, command, "blackpink");
        break;
      case command.startsWith("glitch"):
        await textmakerCommand(sock, chatId, message, command, "glitch");
        break;
      case command.startsWith("fire"):
        await textmakerCommand(sock, chatId, message, command, "fire");
        break;
      case command.startsWith("antidelete"):
        const antideleteMatch = command.slice(10).trim();
        await handleAntideleteCommand(sock, chatId, message, antideleteMatch);
        break;
      case command === "surrender":
        // Handle surrender command for tictactoe game
        await handleTicTacToeMove(sock, chatId, senderId, "surrender");
        break;
      case command === "cleartmp":
        await clearTmpCommand(sock, chatId, message);
        break;
      case command === "setpp":
        await setProfilePicture(sock, chatId, message);
        break;
      case command.startsWith("instagram") ||
        command.startsWith("insta") ||
        command.startsWith("ig"):
        await instagramCommand(sock, chatId, message);
        break;
      case command.startsWith("fb") || command.startsWith("facebook"):
        await facebookCommand(sock, chatId, message);
        break;
      case command.startsWith("video"):
        await videoCommand(sock, chatId, message);
        break;
      case command.startsWith("song") || command.startsWith("music"):
        await playCommand(sock, chatId, message);
        break;
      case command.startsWith("play") ||
        command.startsWith("mp3") ||
        command.startsWith("ytmp3") ||
        command.startsWith("yts"):
        await songCommand(sock, chatId, message);
        break;
      case command.startsWith("tiktok") || command.startsWith("tt"):
        await tiktokCommand(sock, chatId, message);
        break;
      case command.startsWith("gpt") || command.startsWith("gemini"):
        await aiCommand(sock, chatId, message);
        break;
      case command.startsWith("translate") || command.startsWith("trt"):
        const commandLength = command.startsWith("translate") ? 9 : 3;
        await handleTranslateCommand(
          sock,
          chatId,
          message,
          command.slice(commandLength)
        );
        return;
      case command === "admin" || command === "panel" || command === "cms":
        await panelCommand(sock, chatId, message);
        break;
      case command.startsWith("ss") ||
        command.startsWith("ssweb") ||
        command.startsWith("screenshot"):
        const ssCommandLength = command.startsWith("screenshot")
          ? 10
          : command.startsWith("ssweb")
          ? 5
          : 2;
        await handleSsCommand(
          sock,
          chatId,
          message,
          command.slice(ssCommandLength).trim()
        );
        break;
      case command.startsWith("areact") ||
        command.startsWith("autoreact") ||
        command.startsWith("autoreaction"):
        await handleAreactCommand(
          sock,
          chatId,
          message,
          await isOwner(senderId)
        );
        await addCommandReaction(sock, message, "areact");
        break;
      case command === "goodnight" ||
        command === "lovenight" ||
        command === "gn":
        await goodnightCommand(sock, chatId);
        break;
      case command === "shayari" || command === "shayri":
        await shayariCommand(sock, chatId);
        break;
      case command === "roseday":
        await rosedayCommand(sock, chatId);
        break;
      case command.startsWith("imagine") ||
        command.startsWith("gen") ||
        command.startsWith("flux") ||
        command.startsWith("dalle"):
        await imagineCommand(sock, chatId, message);
        break;
      case command.startsWith("remini"):
        const reminiArgs = command.split(" ").slice(1);
        await reminiCommand(sock, chatId, message, reminiArgs);
        break;
      case command.startsWith("setgdesc"):
        const descText = command.slice(8).trim();
        await setGroupDescription(sock, chatId, senderId, descText, message);
        break;
      case command.startsWith("setgname"):
        const nameText = command.slice(8).trim();
        await setGroupName(sock, chatId, senderId, nameText, message);
        break;
      case command.startsWith("setgpp"):
        await setGroupPhoto(sock, chatId, senderId, message);
        break;
      case command.startsWith("removebg") ||
        command.startsWith("rmbg") ||
        command.startsWith("nobg"):
        const removebgArgs = command.split(" ").slice(1);
        await removebg.exec(sock, message, removebgArgs);
        break;
      case command === "settings":
        await settingsCommand(sock, chatId, message);
        break;
      case command.startsWith("sora"):
        await soraCommand(sock, chatId, message);
        break;
      case command.startsWith("sudo"):
        await sudoCommand(sock, chatId, message);
        break;
      case command === "lid":
        await lidCommand(sock, chatId, senderId, message);
        break;
      case command === "listprem" || command === "premlist": {
        const { users } = loadPremium();
        if (users.length === 0) {
          await sock.sendMessage(chatId, {
            text: "📜 No premium users found.",
          });
          return;
        }

        let text = "📜 *Premium User List:*\n\n";
        users.forEach((u, i) => {
          text += `${i + 1}. @${u.number}\n`;
        });

        await sock.sendMessage(chatId, {
          text,
          mentions: users.map((u) => u.jid),
        });
        break;
      }
      case command.startsWith("addprem") || command.startsWith("addpremium"):
        if (!(await isOwner(senderId))) {
          await sock.sendMessage(chatId, {
            text: "❌ Only owner can add premium users.",
          });
          return;
        }
        let userToAdd =
          message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (
          !userToAdd &&
          message.message?.extendedTextMessage?.contextInfo?.participant
        ) {
          userToAdd =
            message.message.extendedTextMessage.contextInfo.participant;
        }
        if (!userToAdd) {
          const args = command.split(" ");
          if (args.length > 1) {
            userToAdd = args[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
          }
        }

        if (!userToAdd) {
          await sock.sendMessage(chatId, {
            text: "Please mention a user or provide a number to add to premium.",
          });
          return;
        }

        addPremium(userToAdd, userToAdd.split("@")[0]);
        await sock.sendMessage(chatId, {
          text: `✅ Added @${userToAdd.split("@")[0]} to premium list`,
          mentions: [userToAdd],
        });

        // Notify the user in DM
        await sock.sendMessage(userToAdd, {
          text: `🎉 *CONGRATULATIONS!* 🎉\n\nYou are now a *PREMIUM USER*! 🌟\n\nEnjoy exclusive features and enhanced access.
           🚀\nhearts from samkiel! 💎`,
        });
        break;
      case command.startsWith("delprem") ||
        command.startsWith("delpremium") ||
        command.startsWith("removepremium"):
        if (!(await isOwner(senderId))) {
          await sock.sendMessage(chatId, {
            text: "❌ Only owner can remove premium users.",
          });
          return;
        }
        let userToDel =
          message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (
          !userToDel &&
          message.message?.extendedTextMessage?.contextInfo?.participant
        ) {
          userToDel =
            message.message.extendedTextMessage.contextInfo.participant;
        }
        if (!userToDel) {
          const args = command.split(" ");
          if (args.length > 1) {
            userToDel = args[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
          }
        }

        if (!userToDel) {
          await sock.sendMessage(chatId, {
            text: "Please mention a user or provide a number to remove from premium.",
          });
          return;
        }

        removePremium(userToDel);
        await sock.sendMessage(chatId, {
          text: `✅ Removed @${userToDel.split("@")[0]} from premium list`,
          mentions: [userToDel],
        });
        break;
      case command.startsWith("addprem"):
        await addPremCommand(sock, chatId, senderId, message);
        break;
      case command.startsWith("delprem"):
        await delPremCommand(sock, chatId, senderId, message);
        break;
      case command === "prefix":
        await prefixCommand(sock, chatId, message, channelInfo);
        break;
      case command.startsWith("setprefix"):
        // Parse raw text to preserve case sensitivity of the new prefix
        const rawCmd = getCommand(rawText, false);
        const newPrefix = rawCmd.split(/\s+/)[1]; // Split by any whitespace

        if (!newPrefix) {
          await sock.sendMessage(chatId, {
            text: `Usage: ${p}setprefix <prefix> or ${p}setprefix off\n\nExamples:\n${p}setprefix !\n${p}setprefix off (no prefix required)\n${p}setprefix . (default)`,
            ...channelInfo,
          });
          return;
        }

        if (newPrefix === "off" || newPrefix === "none") {
          const success = savePrefix("off");
          if (success) {
            await sock.sendMessage(chatId, {
              text: "✅ Prefix disabled! Commands now work without any prefix.",
              ...channelInfo,
            });
          } else {
            await sock.sendMessage(chatId, {
              text: "❌ Failed to disable prefix.",
              ...channelInfo,
            });
          }
        } else {
          const success = savePrefix(newPrefix);
          if (success) {
            await sock.sendMessage(chatId, {
              text: `✅ Prefix set to: ${newPrefix}`,
              ...channelInfo,
            });
          } else {
            await sock.sendMessage(chatId, {
              text: "❌ Failed to set prefix.",
              ...channelInfo,
            });
          }
        }
        break;
      default:
        if (isGroup) {
          // Handle non-command group messages
          if (userMessage) {
            // Make sure there's a message
            await handleChatbotResponse(
              sock,
              chatId,
              message,
              userMessage,
              senderId
            );
          }
          await Antilink(message, sock);
          await handleBadwordDetection(
            sock,
            chatId,
            message,
            userMessage,
            senderId
          );
        }
        break;
    }

    // ✅ Global reaction trigger for all commands
    if (command && typeof command === "string") {
      try {
        await addCommandReaction(sock, message, command);
        console.log(`[AUTO-REACT] Triggered for command: ${command}`);
      } catch (err) {
        console.error("❌ Error in global auto-reaction:", err);
      }
    }

    // ===== Restore original sendMessage =====
    try {
      sock.sendMessage = originalSendMessage;
    } catch (restoreError) {
      console.error("Error restoring sendMessage:", restoreError);
    }
    // ===== END restore =====
  } catch (error) {
    console.error("❌ Error in message handler:", error.message);
    // Only try to send error message if we have a valid chatId
    if (chatId) {
      await sock.sendMessage(chatId, {
        text: "❌ Failed to process command!",
        ...channelInfo,
      });
    }
  }
}

async function handleGroupParticipantUpdate(sock, update) {
  try {
    const { id, participants, action, author } = update;

    // Debug log for group updates
    /* console.log('Group Update in Main:', {
             id,
             participants,
             action,
             author
         });*/

    // Check if it's a group
    if (!id.endsWith("@g.us")) return;

    // Handle promotion events
    if (action === "promote") {
      await handlePromotionEvent(sock, id, participants, author);
      return;
    }

    // Handle demotion events
    if (action === "demote") {
      await handleDemotionEvent(sock, id, participants, author);
      return;
    }
    // Handle join events
    if (action === "add") {
      // Check if welcome is enabled for this group
      const isWelcomeEnabled = await isWelcomeOn(id);
      if (!isWelcomeEnabled) return;

      // Get welcome message from data
      const data = JSON.parse(fs.readFileSync("./data/userGroupData.json"));
      const welcomeData = data.welcome[id];
      const welcomeMessage =
        welcomeData?.message || "Welcome {user} to the group! 🎉";

      // Send welcome message for each new participant
      for (const participant of participants) {
        const user = participant.split("@")[0];
        const formattedMessage = welcomeMessage.replace("{user}", `@${user}`);

        await sock.sendMessage(id, {
          text: formattedMessage,
          mentions: [participant],
        });
      }
    }

    // Handle leave events
    if (action === "remove") {
      // Check if goodbye is enabled for this group
      const isGoodbyeEnabled = await isGoodByeOn(id);
      if (!isGoodbyeEnabled) return;

      // Get goodbye message from data
      const data = JSON.parse(fs.readFileSync("./data/userGroupData.json"));
      const goodbyeData = data.goodbye[id];
      const goodbyeMessage = goodbyeData?.message || "Goodbye {user} 👋";

      // Send goodbye message for each leaving participant
      for (const participant of participants) {
        const user = participant.split("@")[0];
        const formattedMessage = goodbyeMessage.replace("{user}", `@${user}`);

        await sock.sendMessage(id, {
          text: formattedMessage,
          mentions: [participant],
        });
      }
    }
  } catch (error) {
    console.error("Error in handleGroupParticipantUpdate:", error);
  }
}

// Instead, export the handlers along with handleMessages
module.exports = {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus: async (sock, chatUpdate) => {
    const message = chatUpdate.messages[0];
    if (message) {
      await handleAutoStatus(sock, message);
    }
  },
};
