/**
 * Voice Message Handler
 * Processes voice notes using Mistral AI Voice Agent (voxtral-small-latest)
 * Responds with voice using TTS
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const settings = require("../settings");

const TEMP_DIR = path.join(__dirname, "../temp");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Check if message is a voice note or audio
 */
function isVoiceMessage(m) {
  if (!m.message) return false;

  // Standard path
  if (m.message.audioMessage) return true;

  // Nested paths (ViewOnce, Ephemeral, etc.)
  const msg = m.message;
  if (msg.viewOnceMessageV2?.message?.audioMessage) return true;
  if (msg.viewOnceMessage?.message?.audioMessage) return true;
  if (msg.ephemeralMessage?.message?.audioMessage) return true;
  if (msg.documentWithCaptionMessage?.message?.audioMessage) return true;

  return false;
}

/**
 * Get internal audio message object
 */
function getAudioData(m) {
  if (!m.message) return null;
  const msg = m.message;
  if (msg.audioMessage) return msg.audioMessage;
  if (msg.viewOnceMessageV2?.message?.audioMessage)
    return msg.viewOnceMessageV2.message.audioMessage;
  if (msg.viewOnceMessage?.message?.audioMessage)
    return msg.viewOnceMessage.message.audioMessage;
  if (msg.ephemeralMessage?.message?.audioMessage)
    return msg.ephemeralMessage.message.audioMessage;
  if (msg.documentWithCaptionMessage?.message?.audioMessage)
    return msg.documentWithCaptionMessage.message.audioMessage;
  return null;
}

/**
 * Download voice message to temp file
 */
async function downloadVoiceMessage(message, sock) {
  try {
    const buffer = await downloadMediaMessage(
      message,
      "buffer",
      {},
      {
        logger: console,
        reuploadRequest: sock.updateMediaMessage,
      },
    );

    const filename = `voice_${Date.now()}.ogg`;
    const filepath = path.join(TEMP_DIR, filename);
    fs.writeFileSync(filepath, buffer);

    return filepath;
  } catch (error) {
    console.error("Voice download error:", error.message);
    return null;
  }
}

/**
 * Send audio to Mistral Voice Agent (voxtral-small-latest)
 */
async function processVoiceWithMistral(audioPath) {
  const apiKey = settings.mistralVoiceApiKey;
  const agentId = settings.mistralVoiceAgentId;

  if (!apiKey || !agentId) {
    console.log("Voice: No Mistral Voice API key or Agent ID configured");
    return null;
  }

  try {
    // Read audio file and convert to base64
    const audioBuffer = fs.readFileSync(audioPath);
    const audioBase64 = audioBuffer.toString("base64");
    const mimeType = "audio/ogg";

    const response = await axios.post(
      "https://api.mistral.ai/v1/conversations",
      {
        agent_id: agentId,
        inputs: [
          {
            role: "user",
            content: [
              {
                type: "audio",
                data: audioBase64,
                mime_type: mimeType,
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    // Extract text response
    const textAnswer =
      response.data?.outputs?.[0]?.content ||
      response.data?.message?.content ||
      response.data?.choices?.[0]?.message?.content ||
      response.data?.content ||
      response.data?.text;

    // Check for audio response
    const audioResponse = response.data?.outputs?.find(
      (o) => o.type === "audio" || o.audio,
    );

    if (audioResponse?.audio || audioResponse?.data) {
      console.log("✅ Voice: Got audio response from Mistral");
      return {
        text: textAnswer,
        audio: audioResponse.audio || audioResponse.data,
        hasAudio: true,
      };
    }

    if (textAnswer && textAnswer.length > 2) {
      console.log("✅ Voice: Mistral Voice Agent succeeded (text only)");
      return { text: textAnswer, hasAudio: false };
    }

    console.log("Voice response:", JSON.stringify(response.data, null, 2));
    return null;
  } catch (error) {
    console.error("Voice processing error:", error.message);
    if (error.response?.data) {
      console.error("Error details:", JSON.stringify(error.response.data));
    }
    return null;
  }
}

/**
 * Convert text to speech using free TTS API
 */
async function textToSpeech(text) {
  // Try multiple TTS APIs
  const ttsApis = [
    {
      name: "Voicerss",
      fn: async (t) => {
        const response = await axios.get(
          `https://api.voicerss.org/?key=2c97a8c6b1fc4c38b0aa2f5f9d7f3d7d&hl=en-us&src=${encodeURIComponent(t)}&c=MP3`,
          { responseType: "arraybuffer", timeout: 30000 },
        );
        if (response.data && response.data.byteLength > 1000) {
          return Buffer.from(response.data);
        }
        return null;
      },
    },
    {
      name: "StreamElements TTS",
      fn: async (t) => {
        const response = await axios.get(
          `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(t.substring(0, 500))}`,
          { responseType: "arraybuffer", timeout: 30000 },
        );
        if (response.data && response.data.byteLength > 1000) {
          return Buffer.from(response.data);
        }
        return null;
      },
    },
    {
      name: "TTS API",
      fn: async (t) => {
        const response = await axios.get(
          `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(t.substring(0, 200))}&tl=en&client=tw-ob`,
          {
            responseType: "arraybuffer",
            timeout: 30000,
            headers: {
              "User-Agent": "Mozilla/5.0 Chrome/120.0.0.0",
            },
          },
        );
        if (response.data && response.data.byteLength > 500) {
          return Buffer.from(response.data);
        }
        return null;
      },
    },
  ];

  for (const api of ttsApis) {
    try {
      const audio = await api.fn(text);
      if (audio) {
        console.log(`✅ TTS: ${api.name} succeeded`);
        return audio;
      }
    } catch (e) {
      console.log(`TTS ${api.name} failed:`, e.message);
    }
  }

  return null;
}

/**
 * Clean up temp file
 */
function cleanupTempFile(filepath) {
  try {
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (e) {}
}

/**
 * Main voice message handler
 */
async function handleVoiceMessage(sock, chatId, message, senderId) {
  if (!isVoiceMessage(message)) {
    return false;
  }

  const audioData = getAudioData(message);
  const isPtt = audioData?.ptt || false;

  console.log(`🎤 Voice message detected! Sender: ${senderId}, PTT: ${isPtt}`);

  // React to show we're processing
  try {
    await sock.sendMessage(chatId, { react: { text: "🎧", key: message.key } });
  } catch (e) {}

  // Send processing message
  const processingMsg = await sock.sendMessage(
    chatId,
    { text: "🎤 *Processing voice message...*" },
    { quoted: message },
  );

  let audioPath = null;

  try {
    // Download the voice note
    audioPath = await downloadVoiceMessage(message, sock);

    if (!audioPath) {
      await sock.sendMessage(chatId, {
        text: "❌ Failed to download voice message.",
        edit: processingMsg.key,
      });
      return true;
    }

    // Process with Mistral
    const result = await processVoiceWithMistral(audioPath);

    if (result && result.text) {
      // Update status
      await sock.sendMessage(chatId, {
        text: "🔊 *Generating voice response...*",
        edit: processingMsg.key,
      });

      // Try to get audio response
      let audioBuffer = null;

      // If Mistral returned audio, use it
      if (result.hasAudio && result.audio) {
        audioBuffer = Buffer.from(result.audio, "base64");
      } else {
        // Otherwise, convert text to speech
        audioBuffer = await textToSpeech(result.text);
      }

      // Send text response first (edit the processing message)
      await sock.sendMessage(chatId, {
        text: `🎤 *Voice Response:*\n\n${result.text}\n\n*Powered by SAMKIEL BOT*`,
        edit: processingMsg.key,
      });

      // Send voice response if we have audio
      if (audioBuffer) {
        await sock.sendMessage(
          chatId,
          {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            ptt: true, // Send as voice note (push to talk)
          },
          { quoted: message },
        );
        console.log("✅ Voice response sent successfully");
      }

      // React success
      await sock.sendMessage(chatId, {
        react: { text: "✅", key: message.key },
      });
    } else {
      await sock.sendMessage(chatId, {
        text: "❌ Could not process voice message. Please try again.\n\n*Powered by SAMKIEL BOT*",
        edit: processingMsg.key,
      });
    }
  } catch (error) {
    console.error("Voice handler error:", error.message);
    await sock.sendMessage(chatId, {
      text: "❌ Error processing voice message.\n\n*Powered by SAMKIEL BOT*",
      edit: processingMsg.key,
    });
  } finally {
    cleanupTempFile(audioPath);
  }

  return true;
}

module.exports = {
  handleVoiceMessage,
  isVoiceMessage,
};
