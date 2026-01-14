const settings = require("./settings");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const chalk = require("chalk");
const FileType = require("file-type");
const path = require("path");
const axios = require("axios");
const {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus,
  handleCall,
} = require("./main");
const PhoneNumber = require("awesome-phonenumber");
const {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
} = require("./lib/exif");
const {
  smsg,
  isUrl,
  generateMessageTag,
  getBuffer,
  getSizeMedia,
  fetch,
  await,
  sleep,
  reSize,
} = require("./lib/myfunc");
const { loadPrefix } = require("./lib/prefix");
const { getAntiCall } = require("./lib/index");

// Define global reply function
global.reply = async (sock, message, content) => {
  return await sock.sendMessage(
    message.chat || message.key.remoteJid,
    content,
    { quoted: message }
  );
};
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  jidDecode,
  proto,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  delay,
} = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const pino = require("pino");
const readline = require("readline");
const { parsePhoneNumber } = require("libphonenumber-js");
const {
  PHONENUMBER_MCC,
} = require("@whiskeysockets/baileys/lib/Utils/generics");
const { rmSync, existsSync } = require("fs");
const { join } = require("path");

process.on("unhandledRejection", (err) => {
  const message = String(err);
  if (message.includes("conflict") || message.includes("Connection Closed")) {
    console.log("⚠️ Connection conflict detected — restarting session...");
    // Optional: add restart logic here (like reconnect or clean session)
  } else {
    console.error("Unhandled Rejection:", err);
  }
});

let XeonBotInc;

function normalizeToDigits(id) {
  if (!id) return "";
  return String(id)
    .split(":")[0]
    .split("@")[0]
    .replace(/[^0-9]/g, "");
}

// Improved store implementation
const store = {
  messages: {},
  contacts: {},
  chats: {},
  groupMetadata: async (jid) => {
    try {
      const metadata = await XeonBotInc.groupMetadata(jid);
      console.log("Fetched group metadata:", metadata);
      return metadata;
    } catch (error) {
      console.error(`Error fetching group metadata for ${jid}:`, error);
      return {};
    }
  },
  bind: function (ev) {
    // Handle events
    ev.on("messages.upsert", ({ messages }) => {
      messages.forEach((msg) => {
        if (msg.key && msg.key.remoteJid) {
          this.messages[msg.key.remoteJid] =
            this.messages[msg.key.remoteJid] || {};
          this.messages[msg.key.remoteJid][msg.key.id] = msg;
        }
      });
    });

    ev.on("contacts.update", (contacts) => {
      contacts.forEach((contact) => {
        if (contact.id) {
          this.contacts[contact.id] = contact;
        }
      });
    });

    ev.on("chats.set", (chats) => {
      this.chats = chats;
    });
  },
  loadMessage: async (jid, id) => {
    return this.messages[jid]?.[id] || null;
  },
};

let phoneNumber = "2348087357158";
// Automatically sync owner from settings to owner.json
const ownerDataPath = "./data/owner.json";
try {
  let ownerData = { superOwner: [], owners: [] };
  if (fs.existsSync(ownerDataPath)) {
    ownerData = JSON.parse(fs.readFileSync(ownerDataPath, "utf8"));
  }

  const currentOwnerNum = normalizeToDigits(settings.ownerNumber);
  if (!currentOwnerNum) throw new Error("settings.ownerNumber is empty");

  // Ensure arrays
  ownerData.superOwner = Array.isArray(ownerData.superOwner)
    ? ownerData.superOwner
    : ownerData.superOwner
    ? [ownerData.superOwner]
    : [];
  ownerData.owners = Array.isArray(ownerData.owners) ? ownerData.owners : [];

  // Normalize existing values (strip @s.whatsapp.net, @lid, device ids, etc.)
  ownerData.superOwner = Array.from(
    new Set(ownerData.superOwner.map(normalizeToDigits).filter(Boolean))
  );

  ownerData.owners = ownerData.owners
    .map((o) => {
      // Support legacy shapes where owner could be a string or used "jid"
      if (typeof o === "string" || typeof o === "number") {
        const v = normalizeToDigits(o);
        return v ? { number: v, lid: v } : null;
      }
      const num = normalizeToDigits(o?.number || o?.jid);
      if (!num) return null;
      const lid = normalizeToDigits(o?.lid) || num;
      return { number: num, lid };
    })
    .filter(Boolean);

  // Ensure superOwner contains settings owner
  if (!ownerData.superOwner.includes(currentOwnerNum)) {
    ownerData.superOwner.unshift(currentOwnerNum);
  }

  // Ensure owners list contains settings owner (store as numeric LID, not JID)
  const exists = ownerData.owners.some(
    (o) => normalizeToDigits(o.number) === currentOwnerNum
  );
  if (!exists) {
    ownerData.owners.push({ number: currentOwnerNum, lid: currentOwnerNum });
    console.log(
      chalk.green(
        `Automatically added owner ${currentOwnerNum} to owner.json`
      )
    );
  }

  fs.writeFileSync(ownerDataPath, JSON.stringify(ownerData, null, 2));
} catch (err) {
  console.error("Failed to sync owner.json from settings:", err);
}

let owner = JSON.parse(fs.readFileSync("./data/owner.json"));

global.botname = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";
global.themeemoji = "•";

const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code");
const useMobile = process.argv.includes("--mobile");

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY
  ? readline.createInterface({ input: process.stdin, output: process.stdout })
  : null;
const question = (text) => {
  if (rl) {
    return new Promise((resolve) => rl.question(text, resolve));
  } else {
    // In non-interactive environment, use ownerNumber from settings
    return Promise.resolve(settings.ownerNumber || phoneNumber);
  }
};

async function startXeonBotInc() {
  let { version, isLatest } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(`./session`);
  const msgRetryCounterCache = new NodeCache();

  XeonBotInc = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: !pairingCode,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({ level: "fatal" }).child({ level: "fatal" })
      ),
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      let jid = jidNormalizedUser(key.remoteJid);
      let msg = await store.loadMessage(jid, key.id);
      return msg?.message || "";
    },
    msgRetryCounterCache,
    defaultQueryTimeoutMs: undefined,
  });

  store.bind(XeonBotInc.ev);

  // Message handling
  XeonBotInc.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message =
        Object.keys(mek.message)[0] === "ephemeralMessage"
          ? mek.message.ephemeralMessage.message
          : mek.message;
      if (mek.key && mek.key.remoteJid === "status@broadcast") {
        await handleStatus(XeonBotInc, chatUpdate);
        return;
      }
      // Access control logic moved to main.js handleMessages

      if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;

      try {
        await handleMessages(XeonBotInc, chatUpdate, true);
      } catch (err) {
        console.error("Error in handleMessages:", err);
        // Only try to send error message if we have a valid chatId
        if (mek.key && mek.key.remoteJid) {
          await XeonBotInc.sendMessage(mek.key.remoteJid, {
            text: "❌ An error occurred while processing your message.",
            contextInfo: {
              forwardingScore: 1,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363400862271383@newsletter",
                newsletterName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
                serverMessageId: -1,
              },
            },
          }).catch(console.error);
        }
      }
    } catch (err) {
      console.error("Error in messages.upsert:", err);
    }
  });

  // Add these event handlers for better functionality
  XeonBotInc.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (
        (decode.user && decode.server && decode.user + "@" + decode.server) ||
        jid
      );
    } else return jid;
  };

  XeonBotInc.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id = XeonBotInc.decodeJid(contact.id);
      if (store && store.contacts)
        store.contacts[id] = { id, name: contact.notify };
    }
  });

  XeonBotInc.getName = (jid, withoutContact = false) => {
    id = XeonBotInc.decodeJid(jid);
    withoutContact = XeonBotInc.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {};
        resolve(
          v.name ||
            v.subject ||
            PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber(
              "international"
            )
        );
      });
    else
      v =
        id === "0@s.whatsapp.net"
          ? {
              id,
              name: "WhatsApp",
            }
          : id === XeonBotInc.decodeJid(XeonBotInc.user.id)
          ? XeonBotInc.user
          : store.contacts[id] || {};
    return (
      (withoutContact ? "" : v.name) ||
      v.subject ||
      v.verifiedName ||
      PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber(
        "international"
      )
    );
  };

  XeonBotInc.public = true;

  XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store);

  // Handle pairing code
  if (pairingCode && !XeonBotInc.authState.creds.registered) {
    if (useMobile) throw new Error("Cannot use pairing code with mobile api");

    let phoneNumber;
    if (!!global.phoneNumber) {
      phoneNumber = global.phoneNumber;
    } else if (settings.botNumber) {
      phoneNumber = settings.botNumber;
    } else {
      phoneNumber = await question(
        chalk.bgBlack(
          chalk.greenBright(
            `Please type your WhatsApp number 😍\nFormat: 2348087357158 (without + or spaces) : `
          )
        )
      );
    }

    // Clean the phone number - remove any non-digit characters
    phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

    // Ensure number starts with country code
    if (!phoneNumber.startsWith("234") && !phoneNumber.startsWith("91")) {
      phoneNumber = "234" + phoneNumber; // Default to Nigeria if no country code
    }

    setTimeout(async () => {
      try {
        let code = await XeonBotInc.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(
          chalk.black(chalk.bgGreen(`Your Pairing Code : `)),
          chalk.black(chalk.white(code))
        );
        console.log(
          chalk.yellow(
            `\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`
          )
        );
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        console.log(
          chalk.red(
            "Failed to get pairing code. Please check your phone number and try again."
          )
        );
      }
    }, 3000);
  }

  // Connection handling
  XeonBotInc.ev.on("connection.update", async (s) => {
    const { connection, lastDisconnect } = s;
    if (connection == "open") {
      // Prevent multiple logs if already connected
      if (global.isConnected) return;
      global.isConnected = true;

      console.log(chalk.magenta(` `));
      console.log(
        chalk.yellow(
          `🌿Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2)
        )
      );

      // Always Online feature
      if (settings.featureToggles.ALWAYS_ONLINE) {
        console.log("✅ Always Online Mode Active");
        // Initial set
        await XeonBotInc.sendPresenceUpdate("available").catch(() => {});

        // Keep it online with a dedicated interval
        // Clear any existing interval to prevent duplicates
        if (global.onlineInterval) clearInterval(global.onlineInterval);

        global.onlineInterval = setInterval(async () => {
          if (global.isConnected) {
            try {
              await XeonBotInc.sendPresenceUpdate("available");
            } catch (e) {
              // Ignore transient errors
            }
          }
        }, 15000); // Send every 15 seconds to be safe (WhatsApp timeout is ~25s)
      }

      // Send connected message to bot's own number
      const botNumber = XeonBotInc.user.id.split(":")[0] + "@s.whatsapp.net";
      global.botUserJid = botNumber;

      // Resolve and persist the real WhatsApp LID for the configured owner number
      // This fixes cases where messages come from an LID JID and the owner isn't recognized.
      try {
        const ownerNum = normalizeToDigits(settings.ownerNumber);
        if (ownerNum) {
          const lookupJid = `${ownerNum}@s.whatsapp.net`;
          const wa = await XeonBotInc.onWhatsApp(lookupJid).catch(() => null);
          const lidDigits = normalizeToDigits(wa?.[0]?.lid);
          if (lidDigits) {
            let ownerData = { superOwner: [], owners: [] };
            if (fs.existsSync(ownerDataPath)) {
              ownerData = JSON.parse(fs.readFileSync(ownerDataPath, "utf8"));
            }
            ownerData.superOwner = Array.isArray(ownerData.superOwner)
              ? ownerData.superOwner
              : ownerData.superOwner
              ? [ownerData.superOwner]
              : [];
            ownerData.owners = Array.isArray(ownerData.owners)
              ? ownerData.owners
              : [];

            // Normalize and ensure entry
            ownerData.superOwner = Array.from(
              new Set(ownerData.superOwner.map(normalizeToDigits).filter(Boolean))
            );
            if (!ownerData.superOwner.includes(ownerNum)) {
              ownerData.superOwner.unshift(ownerNum);
            }

            const normalizedOwners = ownerData.owners
              .map((o) => {
                if (typeof o === "string" || typeof o === "number") {
                  const v = normalizeToDigits(o);
                  return v ? { number: v, lid: v } : null;
                }
                const num = normalizeToDigits(o?.number || o?.jid);
                if (!num) return null;
                const lid = normalizeToDigits(o?.lid) || num;
                return { number: num, lid };
              })
              .filter(Boolean);
            ownerData.owners = normalizedOwners;

            const existing = ownerData.owners.find(
              (o) => normalizeToDigits(o.number) === ownerNum
            );
            if (existing) {
              existing.lid = lidDigits;
            } else {
              ownerData.owners.push({ number: ownerNum, lid: lidDigits });
            }

            fs.writeFileSync(ownerDataPath, JSON.stringify(ownerData, null, 2));
          }
        }
      } catch (e) {
        console.error("Owner LID sync failed:", e);
      }

      // Allow time for file reads
      const currentPrefix = loadPrefix();
      const p = currentPrefix === "off" ? "None" : currentPrefix;

      // Read dynamic setttings

      let isAutoReactGlobal = settings.featureToggles.AUTO_REACTION; // Default from settings
      try {
        if (fs.existsSync("./data/userGroupData.json")) {
          const d = JSON.parse(fs.readFileSync("./data/userGroupData.json"));
          if (d.autoReaction !== undefined) isAutoReactGlobal = d.autoReaction;
        }
      } catch (e) {}

      const isAntiCallEnabled = await getAntiCall();

      // Disk usage logic for start message
      let usedDisk = 0;
      try {
        const getDirSize = (dirPath) => {
          let size = 0;
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            try {
              const filePath = path.join(dirPath, file);
              const stats = fs.statSync(filePath);
              if (stats.isDirectory()) size += getDirSize(filePath);
              else size += stats.size;
            } catch (e) {}
          }
          return size;
        };
        usedDisk = getDirSize(process.cwd()) / 1024 / 1024;
      } catch (e) {}
      const diskStr = `${Math.round(usedDisk)}MB`;

      const pluginList = [
        `🔌 *Auto Status View:* ${settings.featureToggles.AUTO_STATUS_VIEW}`,
        `🔌 *Always Online:* ${
          settings.featureToggles.ALWAYS_ONLINE ? "On" : "Off"
        }`,
        `🔌 *Anti Delete:* ${
          settings.featureToggles.ANTI_DELETE ? "On" : "Off"
        }`,
        `🔌 *Auto Reaction:* ${isAutoReactGlobal ? "On" : "Off"}`,

        `🔌 *Anti-Call:* ${isAntiCallEnabled ? "On" : "Off"}`,
        `🔌 *Auto Read:* ${settings.featureToggles.SEND_READ ? "On" : "Off"}`,
        `🔌 *Private Mode:* ${
          settings.featureToggles.PERSONAL_MESSAGE ? "On" : "Off"
        }`,
      ].join("\n");

      if (!settings.featureToggles.DISABLE_START_MESSAGE) {
        const uptime = process.uptime();
        const startMsg = `
    ╭─❒ 🤖 *SAMKIEL BOT* ❒
    │
    │ 📌 *Prefix:* ${p}
    │ 🧠 *RAM:* ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB
    │ 💾 *Disk:* ${diskStr}
    │ ⏰ *Time:* ${new Date().toLocaleTimeString()}
    │
    │ 🔌 *Active Plugins:*
    │ ${pluginList.replace(/🔌 /g, "│ ◦ ")}
    │
    ╰──────────────────❒
    
    🌐 *COMMUNITY*
    Join our official group for updates, support and new features!
    https://chat.whatsapp.com/Jgrc79greN63Omt5T7LTzs`;

        await XeonBotInc.sendMessage(botNumber, {
          text: startMsg,
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363400862271383@newsletter",
              newsletterName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
              serverMessageId: -1,
            },
          },
        });
      }

      await delay(1999);
      console.log(
        chalk.yellow(
          `\n\n                  ${chalk.bold.blue(
            `[ ${global.botname || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋"} ]`
          )}\n\n`
        )
      );
      console.log(
        chalk.cyan(`< ================================================== >`)
      );
      console.log(
        chalk.magenta(`\n${global.themeemoji || "•"} YT CHANNEL: samkiel.dev`)
      );
      console.log(
        chalk.magenta(
          `${global.themeemoji || "•"} GITHUB: github.com/samkiel488`
        )
      );
      console.log(
        chalk.magenta(
          `${global.themeemoji || "•"} WA NUMBER: wa.me/+2348087357158`
        )
      );
      console.log(
        chalk.magenta(`${global.themeemoji || "•"} CREDIT: SAMUEL EZEKIEL`)
      );
      console.log(
        chalk.green(
          `${global.themeemoji || "•"} 🤖  Bot Connected Successfully! ✅`
        )
      );
    }
    if (connection === "close") {
      global.isConnected = false;
      const reason = lastDisconnect?.error?.message || "Unknown";
      console.log(chalk.red(`Connection closed. Reason: ${reason}`));
      const isConflict = reason.includes("conflict");
      if (
        lastDisconnect &&
        lastDisconnect.error &&
        lastDisconnect.error.output.statusCode != 401 &&
        !isConflict
      ) {
        console.log(chalk.yellow("Attempting to reconnect..."));
        startXeonBotInc();
      } else if (isConflict) {
        console.log(
          chalk.red(
            "Connection conflict detected. Please log out other sessions and restart the bot."
          )
        );
      }
    }
  });

  XeonBotInc.ev.on("creds.update", saveCreds);

  XeonBotInc.ev.on("group-participants.update", async (update) => {
    await handleGroupParticipantUpdate(XeonBotInc, update);
  });

  XeonBotInc.ev.on("messages.upsert", async (m) => {
    if (
      m.messages[0].key &&
      m.messages[0].key.remoteJid === "status@broadcast"
    ) {
      await handleStatus(XeonBotInc, m);
    }
  });

  XeonBotInc.ev.on("status.update", async (status) => {
    await handleStatus(XeonBotInc, status);
  });

  XeonBotInc.ev.on("messages.reaction", async (status) => {
    await handleStatus(XeonBotInc, status);
  });

  XeonBotInc.ev.on("call", async (callUpdate) => {
    await handleCall(XeonBotInc, callUpdate);
  });

  return XeonBotInc;
}

// Start the bot with error handling
startXeonBotInc().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
