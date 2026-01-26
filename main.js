// Main logic of the bot

const videoCommand = require("./commands/video");
const settings = require("./settings");
require("./config.js");
const { isBanned } = require("./lib/isBanned");
const { isOwner, isSuperOwner } = require("./lib/isOwner");
const { handleAutoStatus } = require("./lib/statusViewer");
const {
  isBotDisabled,
  isGlobalEnabled,
  setGlobalEnabled,
} = require("./lib/botState");
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
  getAntiCall,
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
const urlCommand = require("./commands/url");
const { ocrCommand } = require("./commands/ocr");
const { pollCommand } = require("./commands/poll");
const { letterLeapCommand } = require("./commands/letterleap");
const {
  tempmailCommand,
  checkmailCommand,
  readmailCommand,
} = require("./commands/tempmail");
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
const channelCommand = require("./commands/channel");
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
const { reportCommand } = require("./commands/report");
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
const bibleCommand = require("./commands/bible");
const clearTmpCommand = require("./commands/cleartmp");
const setProfilePicture = require("./commands/setpp");
const instagramCommand = require("./commands/instagram");
const facebookCommand = require("./tests/facebook.js");
const playCommand = require("./commands/play");
const songCommand = require("./commands/song");
const tiktokCommand = require("./commands/tiktok");
const spotifyCommand = require("./commands/spotify");
const twitterCommand = require("./commands/twitter");
const pinterestCommand = require("./commands/pinterest");
const shortsCommand = require("./commands/shorts");
const snapchatCommand = require("./commands/snapchat");
const redditCommand = require("./commands/reddit");
const threadsCommand = require("./commands/threads");
const soundcloudCommand = require("./commands/soundcloud");
const capcutCommand = require("./commands/capcut");
const { groupCommand } = require("./commands/groupmanage");

const playstoreCommand = require("./commands/playstore");

const aiCommand = require("./commands/ai");
const samkielaiCommand = require("./commands/samkielai");
const mathCommand = require("./commands/math");
const { handleTranslateCommand } = require("./commands/translate");
const { handleSsCommand } = require("./commands/ss");
const {
  addCommandReaction,
  handleAreactCommand,
  autoReactToNonCommand,
} = require("./lib/reactions");
const { goodnightCommand } = require("./commands/goodnight");
const movieCommand = require("./commands/movie");
const { valentineCommand } = require("./commands/valentine");
const imagineCommand = require("./commands/imagine");
const { reminiCommand } = require("./commands/remini");
const removebg = require("./commands/removebg");
const addCommand = require("./commands/add");
const updateCommand = require("./commands/update");
const hackgcCommand = require("./commands/hackgc");
const settingsCommand = require("./commands/settings");
const { vcfCommand } = require("./commands/vcf");
const soraCommand = require("./commands/sora");
const sudoCommand = require("./commands/sudo");
const lidCommand = require("./commands/lid");

const handleBotControl = require("./commands/botControl");
const prefixCommand = require("./commands/prefix");
const deployCommand = require("./commands/deploy");
const tutorialCommand = require("./commands/tutorial");
const anticallCommand = require("./commands/anticall");
const pluginCommand = require("./commands/plugin");
const saveStatusCommand = require("./commands/savestatus");
const pdfCommand = require("./commands/pdf");
const autoReadCommand = require("./commands/autoread");
const toggleStartMsgCommand = require("./commands/togglestart");
const {
  listOnlineCommand,
  recordUserActivity,
} = require("./commands/listonline");
const pinCommand = require("./commands/pin");
const livescoreCommand = require("./commands/livescore");
const pmCommand = require("./commands/pm");
const cryptoCommand = require("./commands/crypto");
const { sendText, shouldHaveBranding } = require("./lib/sendResponse");

// New Architecture Commands
const auditlogCommand = require("./commands/auditlog");
const lockdownCommand = require("./commands/lockdown");
const silenceCommand = require("./commands/silence");
const ratelimitCommand = require("./commands/ratelimit");
const snapshotCommand = require("./commands/snapshot");
const failsafeCommand = require("./commands/failsafe");
const { handleVoiceMessage } = require("./commands/voice");

// Voice Chat Toggle
const { voiceChatCommand } = require("./commands/voicechat");

// Owner Management
const setOwnerCommand = require("./commands/setowner");

// New Architecture Libraries
const { logAction, ACTIONS } = require("./lib/auditLog");
const botState = require("./lib/botState");

// Global settings
global.packname = settings.featureToggles.PACKNAME;
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
global.channelInfo = channelInfo;
const { jidNormalizedUser } = require("@whiskeysockets/baileys");
// Safely load owner data
let ownerData;
try {
  if (fs.existsSync("./data/owner.json")) {
    ownerData = JSON.parse(fs.readFileSync("./data/owner.json"));
  } else {
    throw new Error("File not found");
  }
} catch (e) {
  ownerData = {
    superOwner: [settings.ownerNumber],
    owners: [],
  };
}
const rawOwners = [
  ...(Array.isArray(ownerData.superOwner)
    ? ownerData.superOwner
    : [ownerData.superOwner]),
  ...(Array.isArray(ownerData.owners)
    ? ownerData.owners.map((o) => o.number)
    : []),
].filter(Boolean);

const ownerList = rawOwners.map((j) =>
  jidNormalizedUser(`${j}@s.whatsapp.net`),
);

async function handleMessages(sock, messageUpdate, printLog) {
  let chatId;
  try {
    const { messages, type } = messageUpdate;
    if (type !== "notify") return;

    const message = messages[0];
    if (!message?.message) return;

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
    const pushName = message.pushName || "User";

    // Handle PERSONAL_MESSAGE feature (Private Chat Only)
    if (settings.featureToggles.PERSONAL_MESSAGE && isGroup) {
      return;
    }

    const isSudoUser = await isSudo(senderId);

    // Initialize admin status variables
    let isSenderAdmin = false;
    let isBotAdmin = false;
    if (isGroup) {
      const adminStatus = await isAdmin(sock, chatId, senderId);
      isSenderAdmin = adminStatus.isSenderAdmin;
      isBotAdmin = adminStatus.isBotAdmin;

      // Section 5: Record activity for listonline
      recordUserActivity(chatId, senderId);
    }

    // Handle voice messages (processes audio and responds with voice)
    const voiceHandled = await handleVoiceMessage(
      sock,
      chatId,
      message,
      senderId,
    );
    if (voiceHandled) return;

    let userMessage =
      message.message?.conversation?.trim() ||
      message.message?.extendedTextMessage?.text?.trim() ||
      message.message?.listResponseMessage?.singleSelectReply?.selectedRowId?.trim() ||
      message.message?.buttonsResponseMessage?.selectedButtonId?.trim() ||
      "";

    // Initialize dynamic prefix helper
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    const command = getCommand(userMessage); // Full body after prefix
    const cmd = command.split(/\s+/)[0].toLowerCase(); // First word (lowercase)
    const args = command.split(/\s+/).slice(1); // Arguments array

    // Only log command usage
    if (isCommand(userMessage)) {
      if (VALID_COMMANDS.includes(cmd)) {
        console.log(
          `📝 Command used in ${isGroup ? "group" : "private"}: ${userMessage}`,
        );
        // Set recording state for commands
        try {
          // Handle SEND_READ feature (Auto-read)
          if (settings.featureToggles.SEND_READ) {
            await sock.readMessages([message.key]);
          }

          await sock.sendPresenceUpdate("recording", chatId);
          // Global command reaction
          await addCommandReaction(sock, message, cmd);
        } catch (e) {}
      } else {
        // Log suppressed
      }
    } else {
      // Log suppressed
    }

    // Check Global Bot State
    const isBotGloballyEnabled = isGlobalEnabled();
    const isOwnerUser = await isOwner(senderId, sock, message.key);

    // If bot is globally OFF, only allow OWNER to "turn on"
    if (!isBotGloballyEnabled) {
      if (isOwnerUser && cmd === "turnon") {
        setGlobalEnabled(true, senderId);
        return await sock.sendMessage(chatId, {
          text: "✅ Bot has been re-enabled globally.",
          ...channelInfo,
        });
      }
      return; // Ignore everything else
    }

    // New Global Toggle Commands
    if (isOwnerUser) {
      if (cmd === "turnoff") {
        setGlobalEnabled(false, senderId);
        return await sock.sendMessage(chatId, {
          text: "📴 Bot has been disabled globally. Only 'turn on' will work now.",
          ...channelInfo,
        });
      }
    }

    // Check if bot is disabled in this chat
    if (isBotDisabled(chatId) && cmd !== "enablebot") {
      return;
    }
    if (isBanned(senderId) && cmd !== "unban") {
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
          JSON.stringify({
            isPublic: settings.featureToggles.COMMAND_MODE === "public",
          }),
        );
      }
      modeData = JSON.parse(fs.readFileSync("./data/mode.json"));
    } catch {
      modeData = { isPublic: true };
    }

    // Private Mode: Restricts command usage to owners only in group chats.
    // DMs are always allowed to ensure accessibility.
    if (!modeData.isPublic && !isOwnerUser && isGroup) {
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

    if (!message.key.fromMe) {
      incrementMessageCount(chatId, senderId);
    }

    // Check for bad words FIRST, before ANY other processing
    if (isGroup && userMessage && settings.featureToggles.ANTI_BADWORD) {
      await handleBadwordDetection(
        sock,
        chatId,
        message,
        userMessage,
        senderId,
      );
    }

    // Then check for command prefix
    if (!isCommand(userMessage)) {
      // AI/Chatbot reply trigger via mentions and replies
      const quotedMessage =
        message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quotedMessage) {
        const triggers = [
          "samkiel",
          "samkiel bot",
          "samkielai",
          "gpt",
          "math",
          "maths",
          "cal",
          "solve",
          "answer",
          "solution",
        ];
        if (triggers.some((t) => userMessage.toLowerCase().includes(t))) {
          let promptSnippet = "";
          // Resolve actual message inside various wrappers
          const qMsgWrapper =
            quotedMessage.viewOnceMessageV2?.message ||
            quotedMessage.viewOnceMessage?.message ||
            quotedMessage;

          const qMsg =
            qMsgWrapper.imageMessage ||
            qMsgWrapper.videoMessage ||
            qMsgWrapper.audioMessage ||
            quotedMessage; // Fallback if no specific type found

          if (quotedMessage.conversation)
            promptSnippet = quotedMessage.conversation;
          else if (quotedMessage.extendedTextMessage?.text)
            promptSnippet = quotedMessage.extendedTextMessage.text;
          else if (qMsgWrapper.imageMessage?.caption)
            promptSnippet = qMsgWrapper.imageMessage.caption;

          // If it's an image, we pass the image message directly to aiCommand
          const isQuotedImage = !!qMsgWrapper.imageMessage;

          if (promptSnippet || isQuotedImage) {
            // Include the quoted message as the image source if it is an image
            return await aiCommand(
              sock,
              chatId,
              message,
              userMessage, // Use the user's reply as the query
              isQuotedImage ? { message: qMsgWrapper } : null,
            );
          }
        }
      }

      if (isGroup) {
        // Process non-command messages first

        if (settings.featureToggles.ANTI_LINK) {
          await Antilink(message, sock);
        }
      }
    }

    // Add delay for commands except specified ones
    const noDelayCommands = ["ping", "menu", "help", "bot", "list", "leap"];
    if (
      isCommand(userMessage) &&
      !noDelayCommands.some((c) => command.startsWith(c))
    ) {
      const delayMs = isGroup ? 1000 : 500;
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
      "clearsession",
      "areact",
      "autoreact",
      "setprefix",
      "disablebot",
      "enablebot",
      "anticall",
      "voicechat",
      "setowner",
      "admin",
      "panel",
      "cms",
      "setpp",
      "update",
      "pm",
      "bot",
      "sudo",
      "pin",
      "setprefix",
      "autoread",
      "togglestart",
      "auditlog",
      "audit",
      "logs",
      "lockdown",
      "ld",
      "silence",
      "quiet",
      "ratelimit",
      "rl",
      "limit",
      "failsafe",
      "fs",
      "crash",
      "hackgc",
    ];
    const hybridCommands = ["welcome", "goodbye", "chatbot"];

    const isAdminOnlyCommand = adminOnlyCommands.some((cmd) =>
      command.startsWith(cmd),
    );
    const isOwnerOnlyCommand = ownerOnlyCommands.some((cmd) =>
      command.startsWith(cmd),
    );
    const isHybridCommand = hybridCommands.some((cmd) =>
      command.startsWith(cmd),
    );

    const ownerBypass = isOwnerUser; // isOwner already includes SuperOwner and bot's own JID check

    // Admin-only commands: Require admin status (bypass for Owner)
    if (isGroup && isAdminOnlyCommand && !ownerBypass) {
      const { isSenderAdmin, isBotAdmin } = await isAdmin(
        sock,
        chatId,
        senderId,
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

    // Owner-only commands: Require owner only
    if (isOwnerOnlyCommand) {
      if (!isOwnerUser) {
        await sock.sendMessage(chatId, {
          text: "❌ Sorry buddy, this command is restricted to the bot owner only.",
          ...channelInfo,
        });
        return;
      }
    }

    // Hybrid commands: Allow both admins and owner
    if (isGroup && isHybridCommand) {
      if (!isSenderAdmin && !ownerBypass) {
        await sock.sendMessage(chatId, {
          text: "Buddy only group admins or bot owner can use this command.",
          ...channelInfo,
        });
        return;
      }
    }

    // Command handlers
    switch (true) {
      case cmd === "ping":
        await pingCommand(sock, chatId, message);
        break;
      case cmd === "alive":
        await aliveCommand(sock, chatId, message);
        break;
      case cmd === "tutorial":
        await tutorialCommand(sock, chatId, message);
        break;
      case userMessage.toLowerCase() === "mp3": {
        const quotedMessage =
          message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage?.audioMessage) {
          const fileName = quotedMessage.audioMessage.fileName || "song.mp3";
          const searchQuery = fileName
            .replace(".mp3", "")
            .replace(/[_-]/g, " ");

          await sendText(
            sock,
            chatId,
            `⏳ Converting *${searchQuery}* to document format...`,
            { quoted: message },
          );

          try {
            const axios = require("axios");

            // Search YouTube for the song
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
              return await sendText(
                sock,
                chatId,
                "❌ Could not find the song.",
                { quoted: message },
              );
            }

            const video = videos[0];
            const youtubeUrl = video.url;
            let audioUrl = null;
            let title = video.title;

            // ROBUST API CHAIN (Prioritizing Reliable Sources)
            let success = false;

            // 1) Keith API
            if (!success) {
              try {
                const res = await axios.get(
                  `https://keith-api.vercel.app/api/ytmp3?url=${encodeURIComponent(youtubeUrl)}`,
                );
                if (res.data?.success && res.data?.downloadUrl) {
                  audioUrl = res.data.downloadUrl;
                  title = res.data.title || title;
                  success = true;
                }
              } catch (e) {
                console.log("MP3 Doc: Keith failed");
              }
            }

            // 2) Widipe API
            if (!success) {
              try {
                const res = await axios.get(
                  `https://widipe.com.pl/api/m/dl?url=${encodeURIComponent(youtubeUrl)}`,
                );
                if (res.data?.status && res.data?.result?.dl) {
                  audioUrl = res.data.result.dl;
                  title = res.data.result.title || title;
                  success = true;
                }
              } catch (e) {
                console.log("MP3 Doc: Widipe failed");
              }
            }

            // 3) Cobalt API
            if (!success) {
              try {
                const res = await axios.post(
                  "https://api.cobalt.tools/api/json",
                  { url: youtubeUrl, isAudioOnly: true },
                  {
                    headers: {
                      Accept: "application/json",
                      "Content-Type": "application/json",
                    },
                  },
                );
                if (res.data?.url) {
                  audioUrl = res.data.url;
                  title = video.title || title;
                  success = true;
                }
              } catch (e) {
                console.log("MP3 Doc: Cobalt failed");
              }
            }

            // 4) BK4 API
            if (!success) {
              try {
                const res = await axios.get(
                  `https://bk4-api.vercel.app/download/yt?url=${encodeURIComponent(youtubeUrl)}`,
                );
                if (res.data?.status && res.data?.data?.mp3) {
                  audioUrl = res.data.data.mp3;
                  title = video.title || title;
                  success = true;
                }
              } catch (e) {
                console.log("MP3 Doc: BK4 failed");
              }
            }

            // 5) Gifted API
            if (!success) {
              try {
                const res = await axios.get(
                  `https://api.giftedtech.my.id/api/download/ytmp3?url=${encodeURIComponent(youtubeUrl)}&apikey=gifted`,
                );
                if (res.data?.success && res.data?.result?.url) {
                  audioUrl = res.data.result.url;
                  title = res.data.result.title || title;
                  success = true;
                }
              } catch (e) {
                console.log("MP3 Doc: Gifted failed");
              }
            }

            // 6) David Cyril API (Last Resort)
            if (!success) {
              try {
                const res = await axios.get(
                  `https://apis.davidcyril.name.ng/download/ytmp3?url=${encodeURIComponent(youtubeUrl)}`,
                );
                if (res.data?.success && res.data?.result?.download_url) {
                  audioUrl = res.data.result.download_url;
                  title = res.data.result.title || title;
                  success = true;
                }
              } catch (e) {
                console.log("MP3 Doc: David Cyril failed");
              }
            }

            // Send as document if we got an audio URL
            if (audioUrl) {
              await sock.sendMessage(
                chatId,
                {
                  document: { url: audioUrl },
                  mimetype: "audio/mpeg",
                  fileName: `${title.replace(/[<>:"/\\|?*]/g, "")}.mp3`,
                  caption: `📄 *${title}*\n\n_Document format_`,
                },
                { quoted: message },
              );
              return;
            }

            await sendText(
              sock,
              chatId,
              "❌ All download APIs failed. Try again later.",
              { quoted: message },
            );
          } catch (e) {
            console.error("MP3 Document Error:", e.message);
            await sendText(
              sock,
              chatId,
              "❌ Failed to convert to document format.",
              { quoted: message },
            );
          }
        }
        break;
      }

      case cmd === "pin": {
        await pinCommand(sock, chatId, senderId, message, args);
        break;
      }
      case cmd === "unpin": {
        await pinCommand(sock, chatId, senderId, message, ["unpin"]);
        break;
      }

      case cmd === "simage": {
        const quotedMessage =
          message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage?.stickerMessage) {
          await simageCommand(sock, quotedMessage, chatId);
        } else {
          await sendText(
            sock,
            chatId,
            "Please reply to a sticker with the simage command to convert it.",
            {
              quoted: message,
            },
          );
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
          message,
        );
        break;
      case command.startsWith("mute"):
        const muteDuration = parseInt(command.split(" ")[1]);
        if (isNaN(muteDuration)) {
          await sendText(
            sock,
            chatId,
            "Please provide a valid number of minutes.\neg to mute 10 minutes\nmute 10",
          );
        } else {
          await muteCommand(sock, chatId, senderId, muteDuration);
        }
        break;
      case cmd === "unmute":
        await unmuteCommand(sock, chatId, senderId);
        break;
      case command.startsWith("ban"):
        await banCommand(sock, chatId, message);
        break;
      case command.startsWith("unban"):
        await unbanCommand(sock, chatId, message);
        break;
      case command.startsWith("update"):
        {
          const updateArgs = command.slice(6).trim();
          await updateCommand(sock, chatId, message, updateArgs || userMessage);
        }
        break;
      case cmd === "anticall":
        await anticallCommand(sock, chatId, message, args);
        break;
      case command.startsWith("listonline"): {
        await listOnlineCommand(sock, chatId, message);
        break;
      }
      case command.startsWith("help") ||
        command.startsWith("menu") ||
        command.startsWith("bot") ||
        command.startsWith("list"):
        {
          const helpArgs = command.split(/\s+/).slice(1).join(" ");
          await helpCommand(sock, chatId, senderId, message.pushName, helpArgs);
        }
        break;
      case cmd === "channel":
        await channelCommand(sock, chatId, message);
        break;
      case cmd === "plugin" || command === "plugins":
        await pluginCommand(sock, chatId, message);
        break;
      case cmd === "savestatus":
        const saveArgs = userMessage.trim().split(/\s+/).slice(1);
        await saveStatusCommand(sock, chatId, message, saveArgs);
        break;
      case cmd === "sticker" || command === "s":
        await stickerCommand(sock, chatId, message);
        break;
      case cmd === "url" || cmd === "tourl":
        await urlCommand(sock, chatId, message);
        break;
      case cmd === "ocr":
        await ocrCommand(sock, chatId, message);
        break;
      case cmd === "poll":
        await pollCommand(sock, chatId, message, args);
        break;
      case cmd === "leap" || cmd === "letterleap":
        await letterLeapCommand(sock, chatId, message, args, senderId);
        break;
      case cmd === "tempmail":
        await tempmailCommand(sock, chatId);
        break;
      case cmd === "checkmail":
        await checkmailCommand(sock, chatId, message, args);
        break;
      case cmd === "readmail":
        await readmailCommand(sock, chatId, message, args);
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
          message,
        );
        break;
      case command.startsWith("tts"):
        const text = command.slice(3).trim();
        await ttsCommand(sock, chatId, text);
        break;
      case cmd === "delete" || command === "del":
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
              JSON.stringify({ isPublic: true }),
            );
          }
          modeData = JSON.parse(fs.readFileSync("./data/mode.json"));
        } catch (error) {
          console.error("Error reading access mode:", error);
          await sendText(sock, chatId, "Failed to read bot mode status");

          return;
        }

        const action = command.split(" ")[1]?.toLowerCase();
        // If no argument provided, show current status
        if (!action) {
          const currentMode = modeData.isPublic ? "public" : "private";
          await sendText(
            sock,
            chatId,
            `Current bot mode: *${currentMode}*\n\nUsage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only`,
          );

          return;
        }

        if (action !== "public" && action !== "private") {
          await sendText(
            sock,
            chatId,
            `Usage: ${p}mode public/private\n\nExample:\n${p}mode public - Allow everyone to use bot\n${p}mode private - Restrict to owner only`,
          );

          return;
        }

        try {
          // Update access mode
          modeData.isPublic = action === "public";

          // Save updated data
          fs.writeFileSync(
            "./data/mode.json",
            JSON.stringify(modeData, null, 2),
          );

          await sendText(sock, chatId, `Bot is now in *${action}* mode`);
        } catch (error) {
          console.error("Error updating access mode:", error);
          await sendText(sock, chatId, "Failed to update bot access mode");
        }
        break;

      case cmd === "owner":
        await ownerCommand(sock, chatId);
        break;

      case cmd === "disablebot" || command === "enablebot":
        await handleBotControl(sock, chatId, senderId, command, message);
        break;
      case cmd === "vcf": {
        if (!isGroup) {
          await sendText(
            sock,
            chatId,
            "This command can only be used in groups!",
          );

          return;
        }
        // Check if sender is admin or owner
        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isSenderAdmin && !isOwnerUser) {
          await sendText(
            sock,
            chatId,
            "Only group admins or bot owner can use this command.",
          );

          return;
        }
        await vcfCommand(sock, chatId, message);
        break;
      }

      case cmd === "tagall":
        if (isGroup) {
          const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
          if (isSenderAdmin || isOwnerUser) {
            await tagAllCommand(sock, chatId, senderId);
          } else {
            await sendText(
              sock,
              chatId,
              "Sorry, only group admins can use the .tagall command.",
            );
          }
        } else {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups.",
            ...channelInfo,
          });
        }
        break;
      case command.startsWith("tag"):
        const messageText = userMessage.trim().split(/\s+/).slice(1).join(" "); // Fixed rawText error
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
          isSenderAdmin,
        );
        break;
      case cmd === "meme":
        await memeCommand(sock, chatId);
        break;
      case command.startsWith("joke"):
        await jokeCommand(sock, chatId, message);
        break;
      case cmd === "quote":
        await quoteCommand(sock, chatId);
        break;
      case cmd === "fact":
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
      case cmd === "news":
        await newsCommand(sock, chatId, message, args);
        break;
      case cmd === "report" || cmd === "bug":
        await reportCommand(sock, chatId, message);
        break;
      case cmd === "crypto" || cmd === "coin" || cmd === "price":
        await cryptoCommand(sock, chatId, message, args);
        break;
      case cmd === "score" ||
        cmd === "scores" ||
        cmd === "livescore" ||
        cmd === "football":
        await livescoreCommand(sock, chatId, args);
        break;
      case cmd === "fact" || cmd === "facts" || cmd === "trivia":
        await factCommand(sock, chatId, args);
        break;

      // NEW DOWNLOADERS
      case cmd === "spotify" || cmd === "sp":
        await spotifyCommand(sock, chatId, message, args);
        break;
      case cmd === "twitter" || cmd === "tw" || cmd === "x":
        await twitterCommand(sock, chatId, message, args);
        break;
      case cmd === "pinterest" || cmd === "pin":
        await pinterestCommand(sock, chatId, message, args);
        break;
      case cmd === "shorts" || cmd === "ytshorts":
        await shortsCommand(sock, chatId, message, args);
        break;
      case cmd === "snapchat" || cmd === "snap":
        await snapchatCommand(sock, chatId, message, args);
        break;
      case cmd === "reddit" || cmd === "rd":
        await redditCommand(sock, chatId, message, args);
        break;
      case cmd === "threads" || cmd === "th":
        await threadsCommand(sock, chatId, message, args);
        break;
      case cmd === "soundcloud" || cmd === "sc":
        await soundcloudCommand(sock, chatId, message, args);
        break;

      case cmd === "capcut" || cmd === "cc":
        await capcutCommand(sock, chatId, message, args);
        break;
      case cmd === "playstore" || cmd === "apk":
        await playstoreCommand(sock, chatId, message, args);
        break;

      case cmd === "gc" ||
        cmd === "group" ||
        cmd === "groupchat" ||
        cmd === "groupmanage":
        await groupCommand(sock, chatId, message, args, senderId);
        break;

      case command.startsWith("pdf"): {
        let text = userMessage
          .slice(userMessage.toLowerCase().indexOf("pdf") + 3)
          .trim();

        // Check for quoted message text if no direct text provided
        if (!text) {
          const quoted =
            message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          text =
            quoted?.conversation || quoted?.extendedTextMessage?.text || "";
        }

        if (!text) {
          await sock.sendMessage(
            chatId,
            {
              text: "Please provide text or reply to a text message to convert to PDF.\nExample: .pdf Hello World",
              ...channelInfo,
            },
            { quoted: message },
          );
          return;
        }

        await pdfCommand(sock, chatId, text, message);
        break;
      }
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
      case cmd === "topmembers":
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
          const currentPrefix = loadPrefix();
          const p = currentPrefix === "off" ? "" : currentPrefix;
          sock.sendMessage(chatId, {
            text: `Please guess a letter using ${p}guess <letter>`,
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
          const currentPrefix = loadPrefix();
          const p = currentPrefix === "off" ? "" : currentPrefix;
          sock.sendMessage(chatId, {
            text: `Please provide an answer using ${p}answer <answer>`,
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
          stupidArgs,
        );
        break;
      case cmd === "dare":
        await dareCommand(sock, chatId);
        break;
      case cmd === "truth":
        await truthCommand(sock, chatId);
        break;
      case cmd === "movie": {
        await movieCommand(sock, chatId, message, args);
        break;
      }
      case cmd === "bible": {
        await bibleCommand(sock, chatId, args);
        break;
      }

      case cmd === "clear":
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
      case cmd === "blur":
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
          isSenderAdmin,
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
        if (!chatbotAdminStatus.isSenderAdmin && !isOwnerUser) {
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
      case cmd === "flirt":
        await flirtCommand(sock, chatId);
        break;
      case command.startsWith("character"):
        await characterCommand(sock, chatId, message);
        break;
      case command.startsWith("waste"):
        await wastedCommand(sock, chatId, message);
        break;
      case cmd === "ship":
        if (!isGroup) {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups!",
            ...channelInfo,
          });
          return;
        }
        await shipCommand(sock, chatId, message);
        break;
      case cmd === "groupinfo" ||
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
      case cmd === "resetlink" ||
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
      case cmd === "staff" || command === "admins" || command === "listadmin":
        if (!isGroup) {
          await sock.sendMessage(chatId, {
            text: "This command can only be used in groups!",
            ...channelInfo,
          });
          return;
        }
        await staffCommand(sock, chatId, message);
        break;
      case cmd === "emojimix" || cmd === "emix":
        await emojimixCommand(sock, chatId, message);
        break;
      case cmd === "tg" ||
        cmd === "stickertelegram" ||
        cmd === "tgsticker" ||
        cmd === "telesticker":
        await stickerTelegramCommand(sock, chatId, message);
        break;

      case cmd === "deyplay" || command === "vv" || command === "dplay": {
        const args = userMessage.trim().split(/\s+/).slice(1);
        const isDm = args[0]?.toLowerCase() === "dm";
        await viewOnceCommand(sock, chatId, message, isDm);
        break;
      }
      case cmd === "clearsession" || command === "clearsesi":
        await clearSessionCommand(sock, chatId, message);
        break;
      case command.startsWith("autostatus"):
        const autoStatusArgs = command.trim().split(/\s+/).slice(1);
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
      case cmd === "surrender":
        // Handle surrender command for tictactoe game
        await handleTicTacToeMove(sock, chatId, senderId, "surrender");
        break;
      case cmd === "cleartmp":
        await clearTmpCommand(sock, chatId, message);
        break;
      case cmd === "setpp":
        await setProfilePicture(sock, chatId, message);
        break;
      case cmd === "instagram" || cmd === "insta" || cmd === "ig":
        await instagramCommand(sock, chatId, message);
        break;
      case cmd === "fb" || cmd === "facebook":
        await facebookCommand(sock, chatId, message);
        break;
      case cmd === "video":
        await videoCommand(sock, chatId, message);
        break;
      case cmd === "play":
        await playCommand(sock, chatId, message);
        break;
      case cmd === "song" ||
        cmd === "music" ||
        cmd === "mp3" ||
        cmd === "ytmp3" ||
        cmd === "yts":
        await songCommand(sock, chatId, message);
        break;

      case cmd === "tiktok" || cmd === "tt":
        await tiktokCommand(sock, chatId, message);
        break;
      case cmd === "samkielai" || cmd === "skai":
        await samkielaiCommand(sock, chatId, message);
        break;
      case cmd === "gpt" ||
        cmd === "gemini" ||
        cmd === "deepseek" ||
        cmd === "ds":
        await aiCommand(sock, chatId, message);
        break;
      case cmd === "math" ||
        cmd === "maths" ||
        cmd === "cal" ||
        cmd === "calculate" ||
        cmd === "solve":
        await mathCommand(sock, chatId, message);
        break;
      case cmd === "translate" || cmd === "trt":
        const commandLength = cmd === "translate" ? 9 : 3;
        await handleTranslateCommand(
          sock,
          chatId,
          message,
          command.slice(commandLength),
        );
        break;

      case cmd === "admin" || command === "panel" || command === "cms":
        await panelCommand(sock, chatId, message);
        break;
      case cmd === "ss" || cmd === "ssweb" || cmd === "screenshot":
        const ssCommandLength =
          cmd === "screenshot" ? 10 : cmd === "ssweb" ? 5 : 2;
        await handleSsCommand(
          sock,
          chatId,
          message,
          command.slice(ssCommandLength).trim(),
        );
        break;
      case cmd === "areact" || cmd === "autoreact" || cmd === "autoreaction":
        await handleAreactCommand(
          sock,
          chatId,
          message,
          await isOwner(senderId),
        );
        await addCommandReaction(sock, message, "areact");
        break;
      case cmd === "goodnight" || command === "lovenight" || command === "gn":
        await goodnightCommand(sock, chatId);
        break;
      case cmd === "valentine" || cmd === "val":
        await valentineCommand(sock, chatId);
        break;
      case cmd === "imagine" ||
        cmd === "gen" ||
        cmd === "flux" ||
        cmd === "dalle":
        await imagineCommand(sock, chatId, message);
        break;
      case cmd === "remini":
        await reminiCommand(sock, chatId, message, args);
        break;

      case cmd === "removebg" || cmd === "rmbg" || cmd === "nobg":
        await removebg.exec(sock, message, args);
        break;
      case cmd === "settings":
        await settingsCommand(sock, chatId, message);
        break;
      case cmd === "sora":
        await soraCommand(sock, chatId, message);
        break;
      case cmd === "sudo":
        await sudoCommand(sock, chatId, message);
        break;
      case cmd === "add":
        const addArgs = userMessage.trim().split(/\s+/).slice(1);
        await addCommand(sock, chatId, senderId, message, addArgs);
        break;
      case cmd === "lid":
        await lidCommand(sock, chatId, senderId, message);
        break;

      case cmd === "tempmail":
        await tempmailCommand(sock, chatId);
        break;
      case cmd === "checkmail":
        await checkmailCommand(sock, chatId, message, args);
        break;
      case cmd === "readmail":
        await readmailCommand(sock, chatId, message, args);
        break;

      case cmd === "pm":
        await pmCommand(sock, chatId, senderId, message, args);
        break;

      case cmd === "score" || cmd === "livescore" || cmd === "football":
        await livescoreCommand(sock, chatId, args);
        break;

      case cmd === "prefix":
        await prefixCommand(sock, chatId, message, channelInfo);
        break;
      case cmd === "deploy":
        await deployCommand(sock, chatId, message);
        break;
      case cmd === "setprefix":
        // isOwnerUser check already done at top level
        // Parse raw text to preserve case sensitivity of the new prefix
        const rawCmd = getCommand(userMessage, false);
        const parts = rawCmd.trim().split(/\s+/);
        const newPrefix = parts.length > 1 ? parts[1] : null;

        if (!newPrefix) {
          await sendText(
            sock,
            chatId,
            `Usage: ${p}setprefix <prefix> or ${p}setprefix off\n\nExamples:\n${p}setprefix !\n${p}setprefix off (no prefix required)\n${p}setprefix . (default)`,
          );
          return;
        }

        if (newPrefix === "off" || newPrefix === "none") {
          const success = savePrefix("off");
          if (success) {
            await sendText(
              sock,
              chatId,
              "✅ Prefix disabled! Commands now work without any prefix.",
            );
          } else {
            await sendText(sock, chatId, "❌ Failed to disable prefix.");
          }
        } else {
          const success = savePrefix(newPrefix);
          if (success) {
            await sendText(sock, chatId, `✅ Prefix set to: ${newPrefix}`);
          } else {
            await sendText(sock, chatId, "❌ Failed to set prefix.");
          }
        }

        break;
      case command.startsWith("autoread"):
        await autoReadCommand(sock, chatId, message);
        break;
      case command.startsWith("togglestart"):
        await toggleStartMsgCommand(sock, chatId, message);
        break;

      // =====================
      // NEW ARCHITECTURE COMMANDS
      // =====================
      case cmd === "auditlog" || cmd === "audit" || cmd === "logs": {
        const ctx = { senderId, isGroup, isOwner: true };
        await auditlogCommand(sock, chatId, message, args, ctx);
        break;
      }
      case cmd === "lockdown" || cmd === "ld": {
        const ctx = { senderId, isGroup, isOwner: true };
        await lockdownCommand(sock, chatId, message, args, ctx);
        break;
      }
      case cmd === "silence" || cmd === "quiet" || cmd === "mute": {
        const ctx = { senderId, isGroup, isOwner: true };
        await silenceCommand(sock, chatId, message, args, ctx);
        break;
      }
      case cmd === "ratelimit" || cmd === "rl" || cmd === "limit": {
        const ctx = { senderId, isGroup, isOwner: true };
        await ratelimitCommand(sock, chatId, message, args, ctx);
        break;
      }
      case cmd === "snapshot" || cmd === "botinfo" || cmd === "state": {
        // Snapshot is admin/owner
        let adminCheck = false;
        if (isGroup && !isOwnerUser) {
          try {
            const groupMeta = await sock.groupMetadata(chatId);
            const participant = groupMeta.participants.find(
              (p) =>
                p.id === senderId ||
                p.id.split("@")[0] === senderId.split("@")[0],
            );
            adminCheck =
              participant?.admin === "admin" ||
              participant?.admin === "superadmin";
          } catch (e) {}
        }
        if (isOwnerUser || adminCheck) {
          const ctx = {
            senderId,
            isGroup,
            isOwner: isOwnerUser,
            isAdmin: adminCheck,
          };
          await snapshotCommand(sock, chatId, message, args, ctx);
        }
        break;
      }
      case cmd === "failsafe" || cmd === "fs" || cmd === "crash": {
        const ctx = { senderId, isGroup, isOwner: true };
        await failsafeCommand(sock, chatId, message, args, ctx);
        break;
      }
      case cmd === "hackgc": {
        await hackgcCommand(sock, chatId, message, senderId);
        break;
      }

      // Voice Chat Toggle Command
      case cmd === "voicechat": {
        await voiceChatCommand(sock, chatId, message, args);
        break;
      }

      // Set Owner Command
      case cmd === "setowner": {
        const ownerCheck = await isOwner(senderId, sock);
        const superCheck = isSuperOwner(senderId);
        if (ownerCheck || superCheck) {
          await setOwnerCommand(sock, chatId, message, args);
        } else {
          await sock.sendMessage(chatId, {
            text: "❌ Only owners can use this command.",
          });
        }
        break;
      }

      default:
        // Non-command messages are already handled above (chatbot, antilink, badword)
        break;
    }

    // ✅ Global reaction trigger for all commands
    if (command && typeof command === "string") {
      try {
        await addCommandReaction(sock, message, command);
      } catch (err) {
        console.error("❌ Error in global auto-reaction:", err);
      }
    }
  } catch (error) {
    // Suppress "Connection Closed" errors which happen during restarts/network issues
    if (
      error.message?.includes("Connection Closed") ||
      error.message?.includes("428") ||
      error.message?.includes("Timed Out")
    ) {
      console.warn("⚠️ Connection interrupted during message processing.");
      return;
    }

    console.error("❌ Error in message handler:", error.message);
    // Only try to send error message if we have a valid chatId
    if (chatId) {
      try {
        await sendText(sock, chatId, "❌ Failed to process command!");
      } catch (e) {
        // Ignore errors sending the error message (e.g. if connection is closed)
      }
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

      try {
        // Get Group Metadata
        const groupMetadata = await sock.groupMetadata(id);
        const groupName = groupMetadata.subject;
        const memberCount = groupMetadata.participants.length;
        const groupDesc = groupMetadata.desc?.toString() || "No description";

        // Get welcome message from data
        const data = JSON.parse(fs.readFileSync("./data/userGroupData.json"));
        const welcomeData = data.welcome[id];
        const customMessage =
          welcomeData?.message || "Welcome to the group! 🎉";

        // Send welcome message for each new participant
        for (const participant of participants) {
          let ppUrl;
          try {
            ppUrl = await sock.profilePictureUrl(participant, "image");
          } catch (e) {
            // Fallback default image if privacy settings prevent getting PP
            ppUrl =
              "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg";
          }

          const userUser = participant.split("@")[0];
          const text = `
╭━━━━━━━━━━━━━━━━━━━┈⊷
┃ 👤 *Hello @${userUser}*
┃ 📛 *Welcome to* ${groupName}
┃ 👥 *Members:* ${memberCount}
┃ 🕒 *Joined:* ${new Date().toLocaleTimeString()}
┃
┃ Join our channel here:
┃ ${global.channelLink}
╰━━━━━━━━━━━━━━━━━━━┈⊷`.trim();

          await sock.sendMessage(id, {
            image: { url: ppUrl },
            caption: text,
            mentions: [participant],
            ...global.channelInfo,
          });
        }
      } catch (err) {
        console.error("Error sendingg welcome message:", err);
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
// Handle incoming calls
async function handleCall(sock, callUpdate) {
  const isAntiCallEnabled = await getAntiCall();
  if (!isAntiCallEnabled) return;

  for (const call of callUpdate) {
    if (call.status === "offer") {
      const callId = call.id;
      const callerId = call.from;

      await sock.rejectCall(callId, callerId);

      // Optional: Inform the caller
      // await sock.sendMessage(callerId, { text: "📞 Calls are disabled for this bot." });
    }
  }
}

module.exports = {
  handleMessages,
  handleGroupParticipantUpdate,
  handleCall,
  handleStatus: async (sock, chatUpdate) => {
    if (chatUpdate.messages && chatUpdate.messages.length > 0) {
      const message = chatUpdate.messages[0];
      await handleAutoStatus(sock, message);
    }
  },
};
