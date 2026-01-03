module.exports = {
  // AI
  gpt: {
    description:
      "Chat with the GPT AI model to get answers to your questions, write code, or just chat.",
    usage: "gpt <your message>",
    category: "AI",
  },
  gemini: {
    description:
      "Interact with Google's Gemini AI for smart conversations and information.",
    usage: "gemini <your query>",
    category: "AI",
  },
  deepseek: {
    description:
      "Query the DeepSeek AI model for specialized knowledge and coding help.",
    usage: "deepseek <your query>",
    category: "AI",
  },
  imagine: {
    description:
      "Generate high-quality images from a text description using advanced AI models.",
    usage: "imagine <prompt>",
    category: "AI",
  },
  remini: {
    description:
      "Enhance and upscale your blurry or low-quality images using AI.",
    usage: "remini <reply to image>",
    category: "AI",
  },
  sora: {
    description:
      "Generate short videos from text prompts using AI (Simulation).",
    usage: "sora <prompt>",
    category: "AI",
  },
  removebg: {
    description: "Automatically remove the background from your images.",
    usage: "removebg <reply to image>",
    category: "AI",
  },

  // General
  help: {
    description:
      "Display the main menu or get detailed help for a specific command.",
    usage: "help OR help <command>",
    category: "General",
  },
  ping: {
    description:
      "Check the bot's response speed and system status (RAM, Disk, Uptime).",
    usage: "ping",
    category: "General",
  },
  alive: {
    description: "Check if the bot is online and working correctly.",
    usage: "alive",
    category: "General",
  },
  tts: {
    description:
      "Converts your text into high-quality speech (Text-to-Speech).",
    usage: "tts <text>",
    category: "General",
  },
  owner: {
    description: "Get information about the bot owner and developer.",
    usage: "owner",
    category: "General",
  },
  weather: {
    description: "Check the current weather conditions for a specific city.",
    usage: "weather <city name>",
    category: "General",
  },
  lyrics: {
    description: "Find the lyrics for any song you're looking for.",
    usage: "lyrics <song name>",
    category: "General",
  },
  ss: {
    description: "Take a full-page screenshot of any website URL.",
    usage: "ss <url>",
    category: "General",
  },
  pdf: {
    description: "Convert text or replied text messages into a PDF document.",
    usage: "pdf <text>",
    category: "General",
  },

  // Admin
  add: {
    description: "Add a new member to the group using their phone number.",
    usage: "add <number>",
    category: "Admin",
  },
  kick: {
    description:
      "Remove a member from the group. You can mention them or reply to their message.",
    usage: "kick @user OR kick <reply>",
    category: "Admin",
  },
  ban: {
    description: "Ban a user from using the bot globally.",
    usage: "ban @user",
    category: "Admin",
  },
  promote: {
    description: "Make a group member an admin of the group.",
    usage: "promote @user",
    category: "Admin",
  },
  demote: {
    description: "Remove admin privileges from a group member.",
    usage: "demote @user",
    category: "Admin",
  },
  mute: {
    description:
      "Close group settings so only admins can send messages for a certain duration.",
    usage: "mute <minutes>",
    category: "Admin",
  },
  unmute: {
    description: "Open group settings so everyone can send messages.",
    usage: "unmute",
    category: "Admin",
  },
  tagall: {
    description: "Mention every single member of the group in one message.",
    usage: "tagall <optional message>",
    category: "Admin",
  },
  antilink: {
    description:
      "Automatically delete WhatsApp group links sent by non-admins.",
    usage: "antilink on/off",
    category: "Admin",
  },

  // Owner
  mode: {
    description:
      "Switch the bot between Public (available to everyone) and Private (owner only) modes.",
    usage: "mode public/private",
    category: "Owner",
  },
  autostatus: {
    description: "Configure automatic status viewing and reactions.",
    usage: "autostatus on/off",
    category: "Owner",
  },
  autoread: {
    description: "Automatically mark incoming messages as read (Blue Ticks).",
    usage: "autoread on/off",
    category: "Owner",
  },
  togglestart: {
    description: "Enable or disable the startup notification message.",
    usage: "togglestart on/off",
    category: "Owner",
  },
  update: {
    description: "Update the bot to the latest version from GitHub.",
    usage: "update OR update --force",
    category: "Owner",
  },

  // Downloader
  play: {
    description: "Search for and download audio from YouTube by song name.",
    usage: "play <song name>",
    category: "Downloader",
  },
  song: {
    description: "Download high-quality MP3 from YouTube.",
    usage: "song <song name>",
    category: "Downloader",
  },
  video: {
    description: "Search for and download videos from YouTube.",
    usage: "video <video name>",
    category: "Downloader",
  },
  instagram: {
    description: "Download videos or reels from Instagram using the link.",
    usage: "instagram <reel-link>",
    category: "Downloader",
  },
  tiktok: {
    description: "Download TikTok videos without watermark using the link.",
    usage: "tiktok <tiktok-link>",
    category: "Downloader",
  },
};
