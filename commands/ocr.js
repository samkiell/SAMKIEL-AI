const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { TelegraPh, UploadFileUgu } = require("../lib/uploader");
const { sendText } = require("../lib/sendResponse");
const { isMathProblem } = require("../lib/mathSolver");
const mathCommand = require("./math");

async function getMediaBufferAndExt(message) {
  const m = message.message || {};
  if (m.imageMessage) {
    const stream = await downloadContentFromMessage(m.imageMessage, "image");
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return { buffer: Buffer.concat(chunks), ext: ".jpg" };
  }
  return null;
}

async function getQuotedMediaBufferAndExt(message) {
  const quoted =
    message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
  if (!quoted) return null;
  return getMediaBufferAndExt({ message: quoted });
}

async function ocrCommand(sock, chatId, message) {
  try {
    let media = await getMediaBufferAndExt(message);
    if (!media) media = await getQuotedMediaBufferAndExt(message);

    if (!media) {
      return await sendText(
        sock,
        chatId,
        "📝 *OCR*\nPlease reply to an image to scan text.",
      );
    }

    await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `ocr_${Date.now()}${media.ext}`);
    fs.writeFileSync(tempPath, media.buffer);

    let imageUrl = "";
    try {
      try {
        imageUrl = await TelegraPh(tempPath);
      } catch {
        const res = await UploadFileUgu(tempPath);
        imageUrl = typeof res === "string" ? res : res.url || res.url_full;
      }
    } finally {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch {}
    }

    if (!imageUrl) {
      return await sendText(
        sock,
        chatId,
        "❌ Failed to upload image for processing.",
      );
    }

    const ocrUrl = `https://api.ocr.space/parse/imageurl?apikey=helloworld&url=${imageUrl}`;
    const { data } = await axios.get(ocrUrl);

    if (data?.ParsedResults && data.ParsedResults.length > 0) {
      const text = data.ParsedResults[0].ParsedText;
      if (!text.trim())
        return await sendText(sock, chatId, "⚠️ No text found in image.");

      // Send detected text first
      await sendText(sock, chatId, `📝 *Detected Text:*\n\n${text}`);

      // Check if the extracted text contains a math problem
      if (isMathProblem(text)) {
        await sendText(
          sock,
          chatId,
          "🧮 *Detected math problem! Solving...*",
        );

        // Create a synthetic message object for mathCommand
        const syntheticMessage = {
          message: {
            conversation: `.math ${text}`,
          },
          key: message.key,
        };

        // Call math command to solve the problem
        try {
          await mathCommand(sock, chatId, syntheticMessage);
        } catch (mathError) {
          console.error("Math solving error:", mathError);
          await sendText(
            sock,
            chatId,
            "⚠️ Failed to solve the math problem automatically.",
          );
        }
      }
    } else {
      await sendText(sock, chatId, "❌ OCR failed. Could not read text.");
    }
  } catch (error) {
    console.error("OCR Error:", error);
    await sendText(sock, chatId, "❌ Error occurred during OCR process.");
  }
}

module.exports = { ocrCommand };
