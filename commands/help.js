const settings = require("../settings");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { VALID_COMMANDS, loadPrefix } = require("../lib/prefix");

function formatUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const s2 = Math.floor(s % 60);
  return `${h}h ${m}m ${s2}s`;
}

async function helpCommand(sock, chatId, senderId, pushName) {
  const uptime = formatUptime(process.uptime());
  const currentPrefix = loadPrefix();

  const usedMemory = process.memoryUsage().rss / 1024 / 1024;
  const totalMemory = os.totalmem() / 1024 / 1024;
  const memStr = `${Math.round(usedMemory)}MB / ${Math.round(totalMemory)}MB`;

  const p = currentPrefix === "off" ? "" : currentPrefix;

  const helpMessage = `╭──〔 🤖 *${settings.botName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋"}* 〕──╮
│ ⏱️ *Uptime:* ${uptime}
│ � *Memory:* ${memStr}
│ �👤 *User:* ${pushName || "User"}
│ 👤 *Owner:* ${settings.ownerName || "SAMKIEL"}
│ ⚙️ *Commands:* ${VALID_COMMANDS.length}
│ 📌 *Prefix:* ${currentPrefix === "off" ? "None" : currentPrefix}
│ 🌟 *Version:* ${settings.version || "3.7.2"}
│ 🛠️ *Developer:* ${settings.developer || "ѕαмкιєℓ.∂єν"}
│ 🌐 *Website:* ${settings.website || "https://samkielbot.app"}
╰──────────────────╯

  ╔═══════════════════╗
  🤖 *AI Commands*:
  ║ ✧ 🤖 ${p}gpt
  ║ ✧ 🧠 ${p}gemini
  ║ ✧ 🎨 ${p}imagine
  ║ ✧ 🖼️ ${p}remini
  ║ ✧ 🎥 ${p}sora
  ║ ✧ ✂️ ${p}removebg
  ╚═══════════════════╝

  ╔═══════════════════╗
  🌐 *General Commands*:
  ║ ✧ 🛎️ ${p}help 
  ║ ✧ 📢 ${p}channel
  ║ ✧ 🏓 ${p}ping
  ║ ✧ 🟢 ${p}alive
  ║ ✧ 🗣️ ${p}tts <text>
  ║ ✧ 📌 ${p}prefix
  ║ ✧ 👤 ${p}owner
  ║ ✧ 😂 ${p}joke
  ║ ✧ 💭 ${p}quote
  ║ ✧ 🤔 ${p}fact
  ║ ✧ 🌦️ ${p}weather <city>
  ║ ✧ 📰 ${p}news
  ║ ✧ 📄 ${p}pdf <text>
  ║ ✧ 🎨 ${p}attp <text>
  ║ ✧ 🎵 ${p}lyrics <song_title>
  ║ ✧ 🎱 ${p}8ball <question>
  ║ ✧ 🏷️ ${p}groupinfo
  ║ ✧ 👥 ${p}staff or ${p}admins 
  ║ ✧ 🆚 ${p}deyplay
  ║ ✧ 💌 ${p}pair or ${p}rent
  ║ ✧ 🌍 ${p}trt <text> <lang>
  ║ ✧ 📸 ${p}ss <link>
  ║ ✧ 👁️ ${p}viewonce
  ╚═══════════════════╝ 

  ╔═══════════════════╗
  👮‍♂️ *Admin Commands*:
  ║ ✧ ➕ ${p}add <number>
  ║ ✧ 🔨 ${p}ban @user
  ║ ✧ ⬆️ ${p}promote @user
  ║ ✧ ⬇️ ${p}demote @user
  ║ ✧ ⏱️ ${p}mute <minutes>
  ║ ✧ 🔊 ${p}unmute
  ║ ✧ ❌ ${p}delete or ${p}del
  ║ ✧ 🚫 ${p}kick @user
  ║ ✧ 📊 ${p}warnings @user
  ║ ✧ ⚠️ ${p}warn @user
  ║ ✧ 🔗 ${p}antilink
  ║ ✧ 🛡️ ${p}antibadword
  ║ ✧ 🧹 ${p}clear
  ║ ✧ 📣 ${p}tag <message>
  ║ ✧ 📢 ${p}tagall
  ║ ✧ 🤖 ${p}chatbot
  ║ ✧ 🔄 ${p}resetlink
  ║ ✧ 🔌 ${p}plugin
  ║ ✧ 💾 ${p}savestatus [dm]
  ╚═══════════════════╝

  ╔═══════════════════╗
  🔒 *Owner Commands*:
  ║ ✧ 🛠️ ${p}mode
  ║ ✧ 📤 ${p}autostatus
  ║ ✧ 🗑️ ${p}clearsession
  ║ ✧ 🔍 ${p}antidelete
  ║ ✧ 🧽 ${p}cleartmp
  ║ ✧ 🖼️ ${p}setpp <reply to image>
  ║ ✧ 🤖 ${p}autoreact
  ║ ✧ 🛠️ ${p}setprefix <symbol>
  ║ ✧ 🚫 ${p}disablebot
  ║ ✧ ✅ ${p}enablebot
  ║ ✧ 📞 ${p}anticall on/off
  ╚═══════════════════╝

  ╔═══════════════════╗
  🎨 *Image/Sticker Commands*:
  ║ ✧ 🌀 ${p}blur <image>
  ║ ✧ 🌅 ${p}simage <reply to sticker>
  ║ ✧ 🖼️ ${p}sticker <reply to image>
  ║ ✧ 🎴 ${p}tgsticker <Link>
  ║ ✧ 🤣 ${p}meme
  ║ ✧ ✍️ ${p}take <packname>
  ║ ✧ 🔀 ${p}emojimix <emj1>+<emj2>
  ╚═══════════════════╝  

  ╔═══════════════════╗
  🎮 *Game Commands*:
  ║ ✧ 🎮 ${p}tictactoe @user
  ║ ✧ 🧩 ${p}hangman
  ║ ✧ 🔡 ${p}guess <letter>
  ║ ✧ 🧠 ${p}trivia
  ║ ✧ ❓ ${p}answer <answer>
  ║ ✧ 💬 ${p}truth
  ║ ✧ 🎯 ${p}dare
  ╚═══════════════════╝

  ╔═══════════════════╗
  🎯 *Fun Commands*:
  ║ ✧ 🌟 ${p}compliment @user
  ║ ✧ 😡 ${p}insult @user
  ║ ✧ 💌 ${p}flirt 
  ║ ✧ 🎤 ${p}shayari
  ║ ✧ 🌙 ${p}goodnight
  ║ ✧ 🌹 ${p}roseday
  ║ ✧ 🧙‍♂️ ${p}character @user
  ║ ✧ ☠️ ${p}wasted @user
  ║ ✧ ❤️‍🔥 ${p}ship @user
  ║ ✧ 😘 ${p}simp @user
  ║ ✧ 🤦‍♂️ ${p}stupid @user [text]
  ╚═══════════════════╝

  ╔═══════════════════╗
  🔤 *Textmaker*:
  ║ ✧ ✨ ${p}metallic <text>
  ║ ✧ ❄️ ${p}ice <text>
  ║ ✧ ⛄ ${p}snow <text>
  ║ ✧ 🌟 ${p}impressive <text>
  ║ ✧ 🖥️ ${p}matrix <text>
  ║ ✧ 💡 ${p}light <text>
  ║ ✧ 🌈 ${p}neon <text>
  ║ ✧ 😈 ${p}devil <text>
  ║ ✧ 💜 ${p}purple <text>
  ║ ✧ ⚡ ${p}thunder <text>
  ║ ✧ 🍃 ${p}leaves <text>
  ║ ✧ 🎞️ ${p}1917 <text>
  ║ ✧ 🎞️ ${p}1917 <text>
  ║ ✧ 🛡️ ${p}arena <text>
  ║ ✧ 🖥️ ${p}hacker <text>
  ║ ✧ 🏖️ ${p}sand <text>
  ║ ✧ 🎤 ${p}blackpink <text>
  ║ ✧ 🖥️ ${p}glitch <text>
  ║ ✧ 🔥 ${p}fire <text>
  ╚═══════════════════╝

  ╔═══════════════════╗
  📥 *Downloader*:
  ║ ✧ 🎵 ${p}play <song_name>
  ║ ✧ 🎧 ${p}song <song_name>
  ║ ✧ 📹 ${p}video <query/url>
  ║ ✧ 📸 ${p}instagram <link>
  ║ ✧ 📘 ${p}facebook <link>
  ║ ✧ 🎬 ${p}tiktok <link>
  ╚═══════════════════╝

✉️ Join our community for updates:
https://chat.whatsapp.com/GwVMsm7rRRE7cEIIsvojdd`;

  try {
    const imagePath = path.join(__dirname, "../assets/bot_image.jpg");
    if (fs.existsSync(imagePath)) {
      await sock.sendMessage(chatId, {
        image: fs.readFileSync(imagePath),
        caption: helpMessage,
        ...global.channelInfo,
      });
    } else {
      await sock.sendMessage(chatId, {
        text: helpMessage,
        ...global.channelInfo,
      });
    }
  } catch (e) {
    console.error("Help error:", e);
    await sock.sendMessage(chatId, {
      text: helpMessage,
      ...global.channelInfo,
    });
  }
}

module.exports = helpCommand;
