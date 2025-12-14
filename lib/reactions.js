const fs = require("fs");
const path = require("path");

// 📁 Path to your JSON data file
const USER_GROUP_DATA = path.join(__dirname, "../data/userGroupData.json");

// 🧠 Emojis per command
const commandEmojis = {
  // 🧰 GENERAL COMMANDS
  help: "🧭",
  menu: "📜",
  ping: "📶",
  alive: "💡",
  tts: "🔊",
  owner: "👑",
  joke: "🤣",
  quote: "🧘",
  fact: "📚",
  weather: "🌤️",
  news: "🗞️",
  attp: "💥",
  lyrics: "🎤",
  "8ball": "🔮",
  groupinfo: "📌",
  staff: "🛡️",
  admins: "🛡️",
  vv: "⚔️",
  pair: "💘",
  rent: "💘",
  trt: "🈯",
  ss: "🖼️",

  // 👮‍♂️ ADMIN COMMANDS
  ban: "🔴",
  unban: "🟢",
  promote: "🔺",
  demote: "🔻",
  mute: "🔇",
  unmute: "🔊",
  delete: "🗑️",
  del: "🗑️",
  kick: "🚷",
  add: "➕",
  warnings: "📋",
  warn: "⚠️",
  antilink: "🔗",
  antibadword: "🛡️",
  clear: "🧹",
  tag: "📣",
  tagall: "📢",
  chatbot: "🤖",
  resetlink: "♻️",

  // 👑 OWNER COMMANDS
  mode: "🎛️",
  autostatus: "🚀",
  clearsession: "🧨",
  antidelete: "🕵️‍♂️",
  cleartmp: "🧹",
  setpp: "🖼️",
  autoreact: "🤖",

  // 🖌️ IMAGE/STICKER COMMANDS
  blur: "🌫️",
  simage: "🖼️",
  sticker: "🧊",
  tgsticker: "🎨",
  meme: "😂",
  take: "🏷️",
  emojimix: "⚡",

  // 🕹️ GAME COMMANDS
  leap: "🔠",
  tictactoe: "❌⭕",
  hangman: "🧩",
  guess: "🔠",
  trivia: "🧠",
  answer: "🗯️",
  truth: "🤫",
  dare: "🎯",

  // 🤖 AI COMMANDS
  gpt: "💡",
  gemini: "🧠",

  // 🎯 FUN COMMANDS
  compliment: "😎",
  insult: "🔥",
  flirt: "💘",
  shayari: "🎭",
  goodnight: "💤",
  roseday: "🌸",
  character: "🧝‍♂️",
  wasted: "💀",
  ship: "💘",
  simp: "🤤",
  stupid: "🧠",

  // 🔤 TEXTMAKER
  metallic: "⚙️",
  ice: "🧊",
  snow: "🌨️",
  impressive: "✨",
  matrix: "🧬",
  light: "💡",
  neon: "🌈",
  devil: "👿",
  purple: "💟",
  thunder: "⚡",
  leaves: "🍃",
  1917: "🎬",
  arena: "🛡️",
  hacker: "🧑‍💻",
  sand: "🏝️",
  blackpink: "🎙️",
  glitch: "💻",
  fire: "🔥",

  // 📥 DOWNLOADER
  play: "🎶",
  song: "🎼",
  instagram: "📷",
  facebook: "📙",
  tiktok: "🎥",

  // 💻 GITHUB COMMANDS
  git: "🧩",
  github: "🛠️",
  sc: "⚙️",
  script: "📂",
  repo: "📁",

  // Default fallback
  default: "⏳",
};

// Emojis for random reactions to non-commands
const randomEmojis = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🔥",
  "✨",
  "💯",
  "🤖",
  "👀",
  "🤔",
  "👋",
  "🎉",
  "🌟",
  "🚀",
];

// Load auto-reaction state from file
function loadAutoReactionState() {
  try {
    if (fs.existsSync(USER_GROUP_DATA)) {
      const data = JSON.parse(fs.readFileSync(USER_GROUP_DATA));
      return data.autoReaction || false;
    }
  } catch (error) {
    console.error("Error loading auto-reaction state:", error);
  }
  return false;
}

// Save auto-reaction state to file
function saveAutoReactionState(state) {
  try {
    const data = fs.existsSync(USER_GROUP_DATA)
      ? JSON.parse(fs.readFileSync(USER_GROUP_DATA))
      : { groups: [], chatbot: {} };

    data.autoReaction = state;
    fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving auto-reaction state:", error);
  }
}

// Global toggle
let isAutoReactionEnabled = loadAutoReactionState();

// ✅ Function to add command-specific emoji reaction
async function addCommandReaction(sock, message, commandName = "") {
  try {
    if (!isAutoReactionEnabled || !message?.key?.id) {
      // console.log("[addCommandReaction] Auto-reaction disabled or invalid message");
      return;
    }

    const cmdKey = (commandName || "").trim().toLowerCase().split(" ")[0];
    const emoji = commandEmojis.hasOwnProperty(cmdKey)
      ? commandEmojis[cmdKey]
      : commandEmojis.default;

    await sock.sendMessage(message.key.remoteJid, {
      react: {
        text: emoji,
        key: message.key,
      },
    });
  } catch (error) {
    console.error("Error adding command reaction:", error);
  }
}

// 🛠️ Handle .areact command
async function handleAreactCommand(sock, chatId, message, isOwner) {
  try {
    if (!isOwner) {
      await sock.sendMessage(chatId, {
        text: "❌ This command is only available for the owner!",
        quoted: message,
      });
      return;
    }

    const args = message.message?.conversation?.split(" ") || [];
    const action = args[1]?.toLowerCase();

    if (action === "on") {
      isAutoReactionEnabled = true;
      saveAutoReactionState(true);
      await sock.sendMessage(chatId, {
        text: "✅ Auto-reactions have been enabled globally",
        quoted: message,
      });
    } else if (action === "off") {
      isAutoReactionEnabled = false;
      saveAutoReactionState(false);
      await sock.sendMessage(chatId, {
        text: "✅ Auto-reactions have been disabled globally",
        quoted: message,
      });
    } else {
      const currentState = isAutoReactionEnabled ? "enabled" : "disabled";
      await sock.sendMessage(chatId, {
        text: `Auto-reactions are currently ${currentState} globally.\n\nUse:\n.areact on - Enable auto-reactions\n.areact off - Disable auto-reactions`,
        quoted: message,
      });
    }
  } catch (error) {
    console.error("Error handling areact command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Error controlling auto-reactions",
      quoted: message,
    });
  }
}

// ✅ React to a guessed word: ✅ if correct, ❌ if incorrect (respects global toggle)
async function autoReactWord(sock, message, correctWord) {
  try {
    if (!isAutoReactionEnabled || !message?.key?.id) return;

    // Extract text from the incoming message in common Wa types
    const text = (
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.imageMessage?.caption ||
      message.message?.videoMessage?.caption ||
      ""
    ).toString();

    const cleaned = (text || "").trim().toLowerCase();
    const expected = (correctWord || "").toString().trim().toLowerCase();

    // Tokenize the message to handle command prefixes (e.g. ".leap apple") and punctuation
    const tokens = cleaned
      .replace(/[.,!?;:()\[\]{}"'`]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    // If expected is empty, treat as incorrect
    const isMatch = expected && tokens.includes(expected);
    const emoji = isMatch ? "✅" : "❌";

    await sock.sendMessage(message.key.remoteJid, {
      react: {
        text: emoji,
        key: message.key,
      },
    });
  } catch (error) {
    console.error("Error in autoReactWord:", error);
  }
}

// ✅ React to non-command messages
async function autoReactToNonCommand(sock, message) {
  try {
    if (!isAutoReactionEnabled || !message?.key?.id) return;

    const emoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];

    await sock.sendMessage(message.key.remoteJid, {
      react: {
        text: emoji,
        key: message.key,
      },
    });
  } catch (error) {
    console.error("Error in autoReactToNonCommand:", error);
  }
}

module.exports = {
  addCommandReaction,
  handleAreactCommand,
  autoReactWord,
  autoReactToNonCommand,
};
