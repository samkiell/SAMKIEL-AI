const settings = require("../settings");
const fs = require("fs");
const path = require("path");
const { isPremium } = require("../lib/premium");
const { VALID_COMMANDS } = require("../lib/prefix");

function formatUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const s2 = Math.floor(s % 60);
  return `${h}h ${m}m ${s2}s`;
}

async function helpCommand(sock, chatId, senderId) {
  const uptime = formatUptime(process.uptime());
  const isPrem = isPremium(senderId);

  const helpMessage = `╭──〔 🤖 *${settings.botName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋"}* 〕──╮
│ ⏱️ *Uptime:* ${uptime}
│ ⚙️ *Commands:* ${VALID_COMMANDS.length}
│ 🌟 *Version:* ${settings.version || "3.2"}
│ 🛠️ *Developer:* ${settings.botOwner || "ѕαмкιєℓ.∂єν"}
│ 🌐 *Website:* https://samkiel.dev
╰──────────────────╯

💎 *PREMIUM COMMANDS*
╔═══════════════════╗
║ ✧ 💎 ptag
║ ✧ 💎 upgrade
║ ✧ 💎 premlist
║ ✧ 💎 gpt
║ ✧ 💎 gemini
║ ✧ 💎 imagine
║ ✧ 💎 remini
║ ✧ 💎 sora
║ ✧ 💎 removebg
╚═══════════════════╝

🆓 *FREE COMMANDS*

╔═══════════════════╗
🌐 *General Commands*:
║ ✧ 🛎️ help 
║ ✧ 🏓 ping
║ ✧ 🟢 alive
║ ✧ 🗣️ tts <text>
║ ✧ 👤 owner
║ ✧ 😂 joke
║ ✧ 💭 quote
║ ✧ 🤔 fact
║ ✧ 🌦️ weather <city>
║ ✧ 📰 news
║ ✧ 🎨 attp <text>
║ ✧ 🎵 lyrics <song_title>
║ ✧ 🎱 8ball <question>
║ ✧ 🏷️ groupinfo
║ ✧ 👥 staff or admins 
║ ✧ 🆚 vv
║ ✧ 💌 pair or rent
║ ✧ 🌍 trt <text> <lang>
║ ✧ 📸 ss <link>
╚═══════════════════╝ 

╔═══════════════════╗
👮‍♂️ *Admin Commands*:
║ ✧ 🔨 ban @user
║ ✧ ⬆️ promote @user
║ ✧ ⬇️ demote @user
║ ✧ ⏱️ mute <minutes>
║ ✧ 🔊 unmute
║ ✧ ❌ delete or del
║ ✧ 🚫 kick @user
║ ✧ 📊 warnings @user
║ ✧ ⚠️ warn @user
║ ✧ 🔗 antilink
║ ✧ 🛡️ antibadword
║ ✧ 🧹 clear
║ ✧ 📣 tag <message>
║ ✧ 📢 tagall
║ ✧ 🤖 chatbot
║ ✧ 🔄 resetlink
╚═══════════════════╝

╔═══════════════════╗
🔒 *Owner Commands*:
║ ✧ 🛠️ mode
║ ✧ 📤 autostatus
║ ✧ 🗑️ clearsession
║ ✧ 🔍 antidelete
║ ✧ 🧽 cleartmp
║ ✧ 🖼️ setpp <reply to image>
║ ✧ 🤖 autoreact
╚═══════════════════╝

╔═══════════════════╗
🎨 *Image/Sticker Commands*:
║ ✧ 🌀 blur <image>
║ ✧ 🌅 simage <reply to sticker>
║ ✧ 🖼️ sticker <reply to image>
║ ✧ 🎴 tgsticker <Link>
║ ✧ 🤣 meme
║ ✧ ✍️ take <packname>
║ ✧ 🔀 emojimix <emj1>+<emj2>
╚═══════════════════╝  

╔═══════════════════╗
🎮 *Game Commands*:
║ ✧ 🎮 tictactoe @user
║ ✧ 🧩 hangman
║ ✧ 🔡 guess <letter>
║ ✧ 🧠 trivia
║ ✧ ❓ answer <answer>
║ ✧ 💬 truth
║ ✧ 🎯 dare
╚═══════════════════╝

╔═══════════════════╗
🎯 *Fun Commands*:
║ ✧ 🌟 compliment @user
║ ✧ 😡 insult @user
║ ✧ 💌 flirt 
║ ✧ 🎤 shayari
║ ✧ 🌙 goodnight
║ ✧ 🌹 roseday
║ ✧ 🧙‍♂️ character @user
║ ✧ ☠️ wasted @user
║ ✧ ❤️‍🔥 ship @user
║ ✧ 😘 simp @user
║ ✧ 🤦‍♂️ stupid @user [text]
╚═══════════════════╝

╔═══════════════════╗
🔤 *Textmaker*:
║ ✧ ✨ metallic <text>
║ ✧ ❄️ ice <text>
║ ✧ ⛄ snow <text>
║ ✧ 🌟 impressive <text>
║ ✧ 🖥️ matrix <text>
║ ✧ 💡 light <text>
║ ✧ 🌈 neon <text>
║ ✧ 😈 devil <text>
║ ✧ 💜 purple <text>
║ ✧ ⚡ thunder <text>
║ ✧ 🍃 leaves <text>
║ ✧ 🎞️ 1917 <text>
║ ✧ 🛡️ arena <text>
║ ✧ 🖥️ hacker <text>
║ ✧ 🏖️ sand <text>
║ ✧ 🎤 blackpink <text>
║ ✧ 🖥️ glitch <text>
║ ✧ 🔥 fire <text>
╚═══════════════════╝

╔═══════════════════╗
📥 *Downloader*:
║ ✧ 🎵 play <song_name>
║ ✧ 🎧 song <song_name>
║ ✧ 📸 instagram <link>
║ ✧ 📘 facebook <link>
║ ✧ 🎬 tiktok <link>
╚═══════════════════╝

╔═══════════════════╗
💻 *Github Commands*:
║ ✧ 🧩 git
║ ✧ 🛠️ github
║ ✧ ⚙️ sc
║ ✧ 📂 script
║ ✧ 📁 repo
╚═══════════════════╝

${
  isPrem
    ? "⭐ You are enjoying all premium features."
    : "🔓 Unlock Premium to access advanced features. Use: upgrade"
}

✉️ Join our community for updates:
https://chat.whatsapp.com/GwVMsm7rRRE7cEIIsvojdd`;

  try {
    const imagePath = path.join(__dirname, "../assets/bot_image.jpg");
    if (fs.existsSync(imagePath)) {
      await sock.sendMessage(chatId, {
        image: fs.readFileSync(imagePath),
        caption: helpMessage,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363400862271383@newsletter",
            newsletterName: "Made with 🤍 by Ԇ・SAMKIEL",
            serverMessageId: -1,
          },
        },
      });
    } else {
      await sock.sendMessage(chatId, { text: helpMessage });
    }
  } catch (e) {
    console.error("Help error:", e);
    await sock.sendMessage(chatId, { text: helpMessage });
  }
}

module.exports = helpCommand;
