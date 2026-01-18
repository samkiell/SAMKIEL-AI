const axios = require("axios");
const { sendText } = require("../lib/sendResponse");
const { loadPrefix } = require("../lib/prefix");

async function handleTranslateCommand(sock, chatId, message, match) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  try {
    // Show typing indicator
    try {
      await sock.sendPresenceUpdate("composing", chatId);
      await sock.sendMessage(chatId, {
        react: { text: "🌍", key: message.key },
      });
    } catch (e) {}

    let textToTranslate = "";
    let targetLang = "en"; // Default

    // Check if it's a reply
    const quotedMessage =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (quotedMessage) {
      // If it's a reply, the entire match is likely the language code
      textToTranslate =
        quotedMessage.conversation ||
        quotedMessage.extendedTextMessage?.text ||
        quotedMessage.imageMessage?.caption ||
        quotedMessage.videoMessage?.caption ||
        "";

      const requestedLang = match.trim().split(/\s+/)[0];
      if (requestedLang && requestedLang.length <= 5) {
        targetLang = requestedLang;
      }
    } else {
      // If not a reply, parse args: .trt <text> <lang>
      const args = match.trim().split(/\s+/);
      if (args.length < 2) {
        return await sendText(
          sock,
          chatId,
          `*🌍 TRANSLATOR*\n\n` +
            `Usage:\n` +
            `1. Reply to a message with: *${p}trt <lang>*\n` +
            `2. Or type: *${p}trt <text> <lang>*\n\n` +
            `Example:\n` +
            `*${p}trt hello es*\n\n` +
            `Common Codes: en, es, fr, de, it, ar, hi, zh, ja, ru`,
          { quoted: message },
        );
      }

      // Check if last arg is a language code (usually 2-3 chars, sometimes with locale like pt-BR)
      const lastArg = args[args.length - 1];
      if (
        lastArg.length <= 5 &&
        !lastArg.includes(".") &&
        lastArg.toLowerCase() !== lastArg.toUpperCase()
      ) {
        targetLang = args.pop();
        textToTranslate = args.join(" ");
      } else {
        // Fallback: use 'en' and take all text
        textToTranslate = args.join(" ");
      }
    }

    if (!textToTranslate || textToTranslate.trim() === "") {
      return await sendText(
        sock,
        chatId,
        "❌ Please provide text to translate.",
      );
    }

    // Try Google Translate API (reliable & free)
    try {
      const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      const res = await axios.get(gUrl, { timeout: 10000 });

      if (res.data && res.data[0]) {
        // Concatenate all parts (Google sends multi-sentence as separate array elements)
        const translated = res.data[0].map((part) => part[0]).join("");
        if (translated) {
          return await sendText(
            sock,
            chatId,
            `${translated}\n\n*Powered by SAMKIEL BOT*`,
            { quoted: message },
          );
        }
      }
    } catch (e) {
      console.error("Google Translate failed:", e.message);
    }

    // Fallback: MyMemory API
    try {
      const mUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${targetLang}`;
      const res = await axios.get(mUrl, { timeout: 10000 });
      if (res.data?.responseData?.translatedText) {
        return await sendText(
          sock,
          chatId,
          `${res.data.responseData.translatedText}\n\n*Powered by SAMKIEL BOT*`,
          { quoted: message },
        );
      }
    } catch (e) {
      console.error("MyMemory failed:", e.message);
    }

    throw new Error("Translation failed");
  } catch (error) {
    console.error("❌ Error in translate command:", error);
    await sendText(
      sock,
      chatId,
      `❌ Failed to translate. Make sure you use a valid language code (like 'en', 'es', 'fr').`,
      { quoted: message },
    );
  }
}

module.exports = {
  handleTranslateCommand,
};
