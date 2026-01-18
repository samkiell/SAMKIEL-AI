module.exports = {
  // AI Commands
  gpt: {
    description:
      "Chat with the GPT AI model to get answers, write code, or just chat.",
    usage: "gpt <message>",
    category: "AI",
  },
  gemini: {
    description:
      "Interact with Google's Gemini AI for smart conversations and information.",
    usage: "gemini <query>",
    category: "AI",
  },
  deepseek: {
    description:
      "Query the DeepSeek AI model for specialized knowledge and coding help.",
    usage: "deepseek <query>",
    category: "AI",
  },
  math: {
    description: "Solve complex math problems step-by-step using AI reasoning.",
    usage: "math <problem>",
    category: "AI",
  },
  imagine: {
    description:
      "Generate high-quality images from a text description using AI.",
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

  // General Commands
  help: {
    description:
      "Display the main menu or get detailed help for a specific command.",
    usage: "help OR help <command>",
    category: "General",
  },
  channel: {
    description: "Get the link to the official WhatsApp channel.",
    usage: "channel",
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
    description: "Convert text to high-quality speech (Text-to-Speech).",
    usage: "tts <text>",
    category: "General",
  },
  prefix: {
    description: "Check the current bot prefix.",
    usage: "prefix",
    category: "General",
  },
  owner: {
    description: "Get contact info for the bot owner and developer.",
    usage: "owner",
    category: "General",
  },
  joke: {
    description: "Get a random funny joke.",
    usage: "joke",
    category: "General",
  },
  quote: {
    description: "Get an inspiring quote.",
    usage: "quote",
    category: "General",
  },
  fact: {
    description: "Get a random interesting fact.",
    usage: "fact",
    category: "General",
  },
  weather: {
    description: "Check the current weather for a specific city.",
    usage: "weather <city>",
    category: "General",
  },
  movie: {
    description: "Search for movie details (rating, plot, release date).",
    usage: "movie <name>",
    category: "General",
  },
  news: {
    description: "Get the latest news headlines using Google News RSS.",
    usage: "news",
    category: "General",
  },
  report: {
    description: "Report a bug or issue to the support team.",
    usage: "report",
    category: "General",
  },
  pdf: {
    description: "Convert text into a PDF document.",
    usage: "pdf <text>",
    category: "General",
  },
  attp: {
    description: "Convert text to a colorful flashing sticker.",
    usage: "attp <text>",
    category: "General",
  },
  lyrics: {
    description: "Find lyrics for a song.",
    usage: "lyrics <song name>",
    category: "General",
  },
  "8ball": {
    description: "Ask the magic 8-ball a question.",
    usage: "8ball <question>",
    category: "General",
  },
  groupinfo: {
    description: "Get detailed information about the current group.",
    usage: "groupinfo",
    category: "General",
  },
  staff: {
    description: "List the group admins.",
    usage: "staff",
    category: "General",
  },
  deyplay: {
    description: "Check for ViewOnce messages (Just kidding/Checking).",
    usage: "deyplay",
    category: "General",
  },
  translate: {
    description: "Translate text to a specified language.",
    usage: "translate <lang> <text>",
    category: "General",
  },
  ss: {
    description: "Take a screenshot of a website.",
    usage: "ss <url>",
    category: "General",
  },
  deploy: {
    description: "Get the deployment link for the bot.",
    usage: "deploy",
    category: "General",
  },
  lid: {
    description: "Get your unique WhatsApp LID.",
    usage: "lid",
    category: "General",
  },
  bible: {
    description: "Get a random Bible verse or search for one.",
    usage: "bible <query>",
    category: "General",
  },
  crypto: {
    description: "Get current cryptocurrency prices.",
    usage: "crypto <symbol>",
    category: "General",
  },
  score: {
    description: "Get live football scores.",
    usage: "score <league>",
    category: "General",
  },
  tempmail: {
    description: "Generate a disposable email address.",
    usage: "tempmail",
    category: "General",
  },
  poll: {
    description: "Create a WhatsApp poll.",
    usage: "poll Question | Option1 | Option2",
    category: "General",
  },

  // Admin Commands
  add: {
    description: "Add a member to the group.",
    usage: "add <number>",
    category: "Admin",
  },
  ban: {
    description: "Ban a user from the bot globally.",
    usage: "ban @user",
    category: "Admin",
  },
  promote: {
    description: "Promote a member to admin.",
    usage: "promote @user",
    category: "Admin",
  },
  demote: {
    description: "Demote an admin to member.",
    usage: "demote @user",
    category: "Admin",
  },
  mute: {
    description: "Mute the group (admins only).",
    usage: "mute <minutes>",
    category: "Admin",
  },
  unmute: {
    description: "Unmute the group.",
    usage: "unmute",
    category: "Admin",
  },
  delete: {
    description: "Delete a message sent by the bot (or any if admin).",
    usage: "delete <reply>",
    category: "Admin",
  },
  kick: {
    description: "Kick a member from the group.",
    usage: "kick @user",
    category: "Admin",
  },
  warnings: {
    description: "Check warnings for a user.",
    usage: "warnings @user",
    category: "Admin",
  },
  warn: {
    description: "Warn a user.",
    usage: "warn @user",
    category: "Admin",
  },
  antilink: {
    description: "Enable/disable antilink protection.",
    usage: "antilink on/off",
    category: "Admin",
  },
  antibadword: {
    description: "Enable/disable badword protection.",
    usage: "antibadword on/off",
    category: "Admin",
  },
  clear: {
    description:
      "Clear the chat (Bot deletes its own msgs usually, or clear chat).",
    usage: "clear",
    category: "Admin",
  },
  tag: {
    description: "Tag everyone with a custom message (hidden tag).",
    usage: "tag <msg>",
    category: "Admin",
  },
  tagall: {
    description: "Mention everyone in the group.",
    usage: "tagall",
    category: "Admin",
  },
  chatbot: {
    description: "Enable/disable AI chatbot in the group.",
    usage: "chatbot on/off",
    category: "Admin",
  },
  resetlink: {
    description: "Reset the group invite link.",
    usage: "resetlink",
    category: "Admin",
  },
  plugin: {
    description: "Install/manage plugins.",
    usage: "plugin",
    category: "Admin",
  },
  savestatus: {
    description: "Save a WhatsApp status.",
    usage: "savestatus <reply to status>",
    category: "Admin",
  },
  listonline: {
    description: "List online members in the group.",
    usage: "listonline",
    category: "Admin",
  },
  pin: {
    description: "Pin a message in the group.",
    usage: "pin <reply>",
    category: "Admin",
  },
  unpin: {
    description: "Unpin a message.",
    usage: "unpin <reply>",
    category: "Admin",
  },

  // Owner Commands
  mode: {
    description: "Switch bot mode (Public/Private).",
    usage: "mode public/private",
    category: "Owner",
  },
  autostatus: {
    description: "Auto-view statuses.",
    usage: "autostatus on/off",
    category: "Owner",
  },
  sudo: {
    description: "Manage sudo users.",
    usage: "sudo add/del <number>",
    category: "Owner",
  },
  update: {
    description: "Update bot from git.",
    usage: "update",
    category: "Owner",
  },
  clearsession: {
    description: "Clear auth session (Dangerous).",
    usage: "clearsession",
    category: "Owner",
  },
  antidelete: {
    description: "Enable/disable anti-delete message logging.",
    usage: "antidelete on/off",
    category: "Owner",
  },
  cleartmp: {
    description: "Clear temp folder.",
    usage: "cleartmp",
    category: "Owner",
  },
  setpp: {
    description: "Set bot profile picture.",
    usage: "setpp <reply image>",
    category: "Owner",
  },
  autoreact: {
    description: "Auto-react to owner messages.",
    usage: "autoreact on/off",
    category: "Owner",
  },
  setprefix: {
    description: "Change bot prefix.",
    usage: "setprefix <symbol>",
    category: "Owner",
  },
  disablebot: {
    description: "Disable bot interactivity.",
    usage: "disablebot",
    category: "Owner",
  },
  enablebot: {
    description: "Enable bot interactivity.",
    usage: "enablebot",
    category: "Owner",
  },
  anticall: {
    description: "Auto-reject calls.",
    usage: "anticall on/off",
    category: "Owner",
  },
  autoread: {
    description: "Auto-read messages (Blue tick).",
    usage: "autoread on/off",
    category: "Owner",
  },
  togglestart: {
    description: "Toggle startup message.",
    usage: "togglestart on/off",
    category: "Owner",
  },
  lockdown: {
    description: "Lock the bot usage.",
    usage: "lockdown on/off",
    category: "Owner",
  },
  silence: {
    description: "Silence the bot in a group.",
    usage: "silence <time>",
    category: "Owner",
  },
  ratelimit: {
    description: "Set command rate limits.",
    usage: "ratelimit <n>",
    category: "Owner",
  },
  auditlog: {
    description: "View bot audit logs.",
    usage: "auditlog",
    category: "Owner",
  },
  snapshot: {
    description: "Take a snapshot of internal state.",
    usage: "snapshot",
    category: "Owner",
  },
  failsafe: {
    description: "Emergency mode toggle.",
    usage: "failsafe",
    category: "Owner",
  },
  pm: {
    description: "Configure PM greeting message.",
    usage: "pm on/off/set",
    category: "Owner",
  },

  // Downloader
  play: {
    description: "Download audio from YouTube.",
    usage: "play <song name>",
    category: "Downloader",
  },
  song: {
    description: "Download MP3 from YouTube.",
    usage: "song <name>",
    category: "Downloader",
  },
  video: {
    description: "Download Video from YouTube.",
    usage: "video <name>",
    category: "Downloader",
  },
  instagram: {
    description: "Download Instagram Reels/Posts.",
    usage: "instagram <link>",
    category: "Downloader",
  },
  facebook: {
    description: "Download Facebook videos.",
    usage: "facebook <link>",
    category: "Downloader",
  },
  tiktok: {
    description: "Download TikTok videos (No WM).",
    usage: "tiktok <link>",
    category: "Downloader",
  },
  spotify: {
    description: "Download Spotify tracks.",
    usage: "spotify <link/name>",
    category: "Downloader",
  },
  twitter: {
    description: "Download X/Twitter videos.",
    usage: "twitter <link>",
    category: "Downloader",
  },
  pinterest: {
    description: "Download Pinterest images/videos.",
    usage: "pinterest <link>",
    category: "Downloader",
  },
  shorts: {
    description: "Download YouTube Shorts.",
    usage: "shorts <link>",
    category: "Downloader",
  },
  snapchat: {
    description: "Download Snapchat content.",
    usage: "snapchat <link>",
    category: "Downloader",
  },
  reddit: {
    description: "Download Reddit videos.",
    usage: "reddit <link>",
    category: "Downloader",
  },
  threads: {
    description: "Download Threads videos.",
    usage: "threads <link>",
    category: "Downloader",
  },
  soundcloud: {
    description: "Download SoundCloud audio.",
    usage: "soundcloud <link>",
    category: "Downloader",
  },
  capcut: {
    description: "Download CapCut templates.",
    usage: "capcut <link>",
    category: "Downloader",
  },
  playstore: {
    description: "Search Play Store apps.",
    usage: "playstore <name>",
    category: "Downloader",
  },

  // Image/Sticker
  blur: {
    description: "Blur an image.",
    usage: "blur <reply image>",
    category: "Image/Sticker",
  },
  simage: {
    description: "Convert sticker to image.",
    usage: "simage <reply sticker>",
    category: "Image/Sticker",
  },
  sticker: {
    description: "Convert image/video to sticker.",
    usage: "sticker <reply media>",
    category: "Image/Sticker",
  },
  tgsticker: {
    description: "Download Telegram sticker pack.",
    usage: "tgsticker <link>",
    category: "Image/Sticker",
  },
  meme: {
    description: "Generate a meme.",
    usage: "meme",
    category: "Image/Sticker",
  },
  take: {
    description: "Change sticker pack name (Steal).",
    usage: "take <packname>",
    category: "Image/Sticker",
  },
  emojimix: {
    description: "Mix two emojis.",
    usage: "emojimix 🤣+😭",
    category: "Image/Sticker",
  },
  tourl: {
    description: "Upload media to URL.",
    usage: "tourl <reply media>",
    category: "Image/Sticker",
  },
  ocr: {
    description: "Extract text from image.",
    usage: "ocr <reply image>",
    category: "Image/Sticker",
  },

  // Games
  tictactoe: {
    description: "Play Tic-Tac-Toe.",
    usage: "tictactoe @user",
    category: "Game",
  },
  hangman: {
    description: "Play Hangman.",
    usage: "hangman",
    category: "Game",
  },
  guess: {
    description: "Guess a letter (Hangman).",
    usage: "guess <letter>",
    category: "Game",
  },
  trivia: {
    description: "Play Trivia quiz.",
    usage: "trivia",
    category: "Game",
  },
  answer: {
    description: "Answer a trivia question.",
    usage: "answer <text>",
    category: "Game",
  },
  truth: {
    description: "Get a Truth question.",
    usage: "truth",
    category: "Game",
  },
  dare: {
    description: "Get a Dare challenge.",
    usage: "dare",
    category: "Game",
  },
  leap: {
    description: "Play LetterLeap word chain game.",
    usage: "leap start OR leap <word>",
    category: "Game",
  },

  // Fun
  compliment: {
    description: "Compliment a user.",
    usage: "compliment @user",
    category: "Fun",
  },
  insult: {
    description: "Insult a user.",
    usage: "insult @user",
    category: "Fun",
  },
  flirt: {
    description: "Send a flirt line.",
    usage: "flirt",
    category: "Fun",
  },
  goodnight: {
    description: "Say goodnight.",
    usage: "goodnight",
    category: "Fun",
  },
  valentine: {
    description: "Get a Valentine quote.",
    usage: "valentine",
    category: "Fun",
  },
  character: {
    description: "Assign a character to a user.",
    usage: "character @user",
    category: "Fun",
  },
  wasted: {
    description: "Wasted effect.",
    usage: "wasted @user",
    category: "Fun",
  },
  ship: {
    description: "Calculate love percentage.",
    usage: "ship @user",
    category: "Fun",
  },
  simp: {
    description: "Check simp level.",
    usage: "simp @user",
    category: "Fun",
  },
  stupid: {
    description: "Check stupidity level.",
    usage: "stupid @user",
    category: "Fun",
  },

  // Textmaker
  metallic: {
    description: "Metallic text effect.",
    usage: "metallic <text>",
    category: "Textmaker",
  },
  ice: {
    description: "Ice text effect.",
    usage: "ice <text>",
    category: "Textmaker",
  },
  snow: {
    description: "Snow text effect.",
    usage: "snow <text>",
    category: "Textmaker",
  },
  impressive: {
    description: "Impressive text effect.",
    usage: "impressive <text>",
    category: "Textmaker",
  },
  matrix: {
    description: "Matrix text effect.",
    usage: "matrix <text>",
    category: "Textmaker",
  },
  light: {
    description: "Light text effect.",
    usage: "light <text>",
    category: "Textmaker",
  },
  neon: {
    description: "Neon text effect.",
    usage: "neon <text>",
    category: "Textmaker",
  },
  devil: {
    description: "Devil text effect.",
    usage: "devil <text>",
    category: "Textmaker",
  },
  purple: {
    description: "Purple text effect.",
    usage: "purple <text>",
    category: "Textmaker",
  },
  thunder: {
    description: "Thunder text effect.",
    usage: "thunder <text>",
    category: "Textmaker",
  },
  leaves: {
    description: "Leaves text effect.",
    usage: "leaves <text>",
    category: "Textmaker",
  },
  1917: {
    description: "1917 style text.",
    usage: "1917 <text>",
    category: "Textmaker",
  },
  arena: {
    description: "Arena text effect.",
    usage: "arena <text>",
    category: "Textmaker",
  },
  hacker: {
    description: "Hacker text effect.",
    usage: "hacker <text>",
    category: "Textmaker",
  },
  sand: {
    description: "Sand writing effect.",
    usage: "sand <text>",
    category: "Textmaker",
  },
  blackpink: {
    description: "Blackpink style text.",
    usage: "blackpink <text>",
    category: "Textmaker",
  },
  glitch: {
    description: "Glitch text effect.",
    usage: "glitch <text>",
    category: "Textmaker",
  },
  fire: {
    description: "Fire text effect.",
    usage: "fire <text>",
    category: "Textmaker",
  },
};
