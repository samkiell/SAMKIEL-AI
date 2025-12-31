const fs = require("fs");
const path = require("path");

const PREFIX_FILE = path.join(__dirname, "../data/prefix.json");

// Central list of valid command names (case-insensitive)
const VALID_COMMANDS = [
  "simage",
  "kick",
  "mute",
  "unmute",
  "ban",
  "unban",
  "update",
  "help",
  "menu",
  "bot",
  "list",
  "sticker",
  "s",
  "warnings",
  "warn",
  "tts",
  "delete",
  "del",
  "attp",
  "mode",
  "owner",
  "vcf",
  "tagall",
  "tag",
  "antilink",
  "meme",
  "joke",
  "quote",
  "fact",
  "weather",
  "news",
  "ttt",
  "tictactoe",
  "move",
  "topmembers",
  "hangman",
  "guess",
  "trivia",
  "answer",
  "compliment",
  "insult",
  "8ball",
  "lyrics",
  "stupid",
  "itssostupid",
  "iss",
  "dare",
  "truth",
  "clear",
  "promote",
  "demote",
  "ping",
  "alive",
  "blur",
  "welcome",
  "goodbye",
  "git",
  "github",
  "sc",
  "script",
  "repo",
  "antibadword",
  "chatbot",
  "take",
  "flirt",
  "character",
  "waste",
  "ship",
  "groupinfo",
  "infogp",
  "infogrupo",
  "resetlink",
  "revoke",
  "anularlink",
  "staff",
  "admins",
  "listadmin",
  "emojimix",
  "emix",
  "tg",
  "stickertelegram",
  "tgsticker",
  "telesticker",
  "deyplay",
  "clearsession",
  "clearsesi",
  "autostatus",
  "pair",
  "rent",
  "metallic",
  "ice",
  "snow",
  "impressive",
  "matrix",
  "light",
  "neon",
  "devil",
  "purple",
  "thunder",
  "leaves",
  "1917",
  "arena",
  "hacker",
  "sand",
  "blackpink",
  "glitch",
  "fire",
  "antidelete",
  "surrender",
  "cleartmp",
  "setpp",
  "instagram",
  "insta",
  "ig",
  "fb",
  "facebook",
  "video",
  "song",
  "music",
  "play",
  "mp3",
  "ytmp3",
  "yts",
  "tiktok",
  "tt",
  "gpt",
  "gemini",
  "translate",
  "trt",
  "ss",
  "ssweb",
  "screenshot",
  "areact",
  "autoreact",
  "autoreaction",
  "goodnight",
  "lovenight",
  "gn",
  "shayari",
  "shayri",
  "roseday",
  "imagine",
  "gen",
  "flux",
  "dalle",
  "remini",
  "setgdesc",
  "setgname",
  "setgpp",
  "removebg",
  "rmbg",
  "nobg",
  "settings",
  "sora",
  "sudo",
  "lid",
  "url",
  "setprefix",
  "prefix",
  "addprem",
  "addpremium",
  "delprem",
  "delpremium",
  "removepremium",
  "listprem",
  "premlist",
  "disablebot",
  "enablebot",
  "deploy",
  // Game moves
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",

  // Private chat
  "hi",
  "hello",
  "ezekiel",
  "bot",
  "samkiel",
  "hey",
  "bro",
  "admin",
  "panel",
  "cms",
  "upgrade",
  "rankon",
  "rankoff",
  "channel",
];

// Load prefix from file, default to "." if not exists
function loadPrefix() {
  try {
    const data = JSON.parse(fs.readFileSync(PREFIX_FILE, "utf8"));
    return data.prefix || ".";
  } catch (error) {
    // File doesn't exist or invalid, use default
    return ".";
  }
}

// Save prefix to file
function savePrefix(newPrefix) {
  try {
    const data = { prefix: newPrefix };
    fs.writeFileSync(PREFIX_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving prefix:", error);
    return false;
  }
}

// Check if message is a command
function isCommand(messageText) {
  const prefix = loadPrefix();
  const trimmed = messageText.trim();
  if (!trimmed) return false;

  const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
  // Always allow "prefix" command even without prefix
  if (firstWord === "prefix") return true;

  if (prefix && prefix !== "none" && prefix !== "off") {
    // Prefixed mode: check if starts with prefix
    return trimmed.startsWith(prefix);
  } else {
    // No prefix mode: check if first word is a valid command
    return VALID_COMMANDS.includes(firstWord);
  }
}

// Get command without prefix
function getCommand(messageText, lowercase = true) {
  const prefix = loadPrefix();
  const trimmed = messageText.trim();
  if (!trimmed) return "";

  const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
  // Always allow "prefix" command even without prefix
  if (firstWord === "prefix") return "prefix";

  let commandBody = "";

  if (prefix && prefix !== "none" && prefix !== "off") {
    // Prefixed mode: remove prefix
    if (trimmed.startsWith(prefix)) {
      commandBody = trimmed.slice(prefix.length).trim();
    }
  } else {
    // No prefix mode: return full text as command to preserve arguments
    commandBody = trimmed;
  }

  return lowercase ? commandBody.toLowerCase() : commandBody;
}

module.exports = {
  loadPrefix,
  savePrefix,
  isCommand,
  getCommand,
  VALID_COMMANDS,
};
