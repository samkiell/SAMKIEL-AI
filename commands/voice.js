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
  return !!getAudioData(m);
}

/**
 * Check if message is an image
 */
function isImageMessage(m) {
  return !!(
    m.message?.imageMessage ||
    m.message?.viewOnceMessageV2?.message?.imageMessage ||
    m.message?.viewOnceMessage?.message?.imageMessage
  );
}

/**
 * Get internal audio message object by searching recursively
 */
function getAudioData(m) {
  if (!m || !m.message) return null;

  // Direct check
  if (m.message.audioMessage) return m.message.audioMessage;

  // Recursively search for audioMessage in any nested objects
  const findAudio = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    if (obj.audioMessage) return obj.audioMessage;

    for (const key in obj) {
      if (typeof obj[key] === "object") {
        const found = findAudio(obj[key]);
        if (found) return found;
      }
    }
    return null;
  };

  return findAudio(m.message);
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
 * Download image message to temp file
 */
async function downloadImageMessage(message, sock) {
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

    const filename = `image_${Date.now()}.jpg`;
    const filepath = path.join(TEMP_DIR, filename);
    fs.writeFileSync(filepath, buffer);

    return filepath;
  } catch (error) {
    console.error("Image download error:", error.message);
    return null;
  }
}

const MISTRAL_VOICE_SYSTEM_PROMPT = `
GEMINI SYSTEM PROMPT

Module: Voice Command Orchestration
Platform: WhatsApp
Voice Engine: Mistral AI (TTS)

You are SAMKIEL BOT, operating in WhatsApp voice mode.

Your responsibility is to generate voice-first responses and provide a clean transcription that is attached to the voice note, not sent as a separate chat message.

CORE VOICE RULE (CRITICAL)
When a voice response is required:
DO NOT send a standalone text message
DO NOT send text before voice
DO NOT send text after voice

Instead:
Generate ONE voice response only.
Attach the text as the voice transcription/subtitle, similar to WhatsApp’s native voice note transcript.
The text must exactly match the spoken content.
The UI layer will render the transcription under the voice bubble.
Text exists only as metadata for the voice note.

VOICE STYLE GUIDELINES
Natural human tone
Clear pacing
Friendly and confident
No robotic cadence
No filler words
No excessive enthusiasm
Speak like a calm, intelligent human explaining something over WhatsApp.

CONTENT RULES
Responses must be concise but complete.
Use simple language.
For explanations (especially math):
Speak step by step
Pause naturally between steps
Clearly state the final answer at the end
Avoid saying phrases like:
“Here is the solution”
“Let me explain”
“As an AI”
Just speak naturally.

MATH + VOICE BEHAVIOR
When the command is math, cal, calculate, solve, or similar:
Speak the solution step by step.
Do not read symbols verbatim like “open bracket”.
Convert math into spoken language naturally.
Example style:
“First, we simplify the expression.
Two x plus three x gives five x.
Next, we divide both sides by five.
The final answer is x equals four.”
The same spoken content must be used as the transcription.

IMAGE + VOICE BEHAVIOR
If the input is an image:
Perform OCR.
Understand the content.
Respond using voice only, with transcription attached.
Do not mention OCR or image processing in the response.

ERROR HANDLING (VOICE)
If something is unclear:
Say it briefly and politely.
Ask for clarification in voice.
Keep it short.
Example:
“I couldn’t clearly read the equation in the image. Please resend a clearer photo.”

IDENTITY RULE
If asked who created you:
Say clearly that you were created by SAMKIEL.
Keep it natural.

FINAL OUTPUT FORMAT (INTERNAL)
Your output will be consumed by a pipeline that:
Sends audio using Mistral AI
Attaches your response text as WhatsApp-style transcription

Therefore:
Generate one unified response
Spoken content and transcription must be identical
No markdown
No emojis in voice mode
`;

/**
 * Send audio to Mistral Voice Model (voxtral-small-latest)
 * Uses Chat Completions API with correct input_audio type
 */
async function processVoiceWithMistral(audioPath, imagePath = null) {
  const apiKey = settings.mistralVoiceApiKey || settings.mistralApiKey;

  if (!apiKey) {
    console.log("Voice: No Mistral API key configured");
    return null;
  }

  try {
    const messages = [
      {
        role: "system",
        content: MISTRAL_VOICE_SYSTEM_PROMPT,
      },
    ];

    const userContent = [];

    // Add audio if available
    if (audioPath) {
      const audioBuffer = fs.readFileSync(audioPath);
      const audioBase64 = audioBuffer.toString("base64");
      userContent.push({
        type: "input_audio",
        input_audio: audioBase64,
      });
    }

    // Add image if available (for OCR/Vision)
    if (imagePath) {
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString("base64");
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
        },
      });
    }

    messages.push({
      role: "user",
      content: userContent,
    });

    // Use Agents Completions endpoint
    const response = await axios.post(
      "https://api.mistral.ai/v1/agents/completions",
      {
        agent_id: settings.mistralVoiceAgentId,
        messages: messages,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    const textAnswer = response.data?.choices?.[0]?.message?.content;

    if (textAnswer && textAnswer.length > 2) {
      // Check if response contains audio (some Mistral models/agents might return audio)
      const hasAudio = !!response.data?.choices?.[0]?.message?.audio;
      const audioData = response.data?.choices?.[0]?.message?.audio?.data;

      return {
        text: textAnswer,
        hasAudio: hasAudio,
        audio: audioData,
      };
    }

    console.log("Voice: Empty response from Mistral");
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
 * Convert text to speech using free TTS APIs with Nigerian accent focus
 */
async function textToSpeech(text) {
  // Try multiple TTS APIs, prioritizing Nigerian voices
  const ttsApis = [
    {
      name: "StreamElements (Ezinne - Nigerian Female)",
      fn: async (t) => {
        const response = await axios.get(
          `https://api.streamelements.com/kappa/v2/speech?voice=Ezinne&text=${encodeURIComponent(t.substring(0, 500))}`,
          { responseType: "arraybuffer", timeout: 30000 },
        );
        if (response.data && response.data.byteLength > 1000) {
          return Buffer.from(response.data);
        }
        return null;
      },
    },
    {
      name: "StreamElements (Abeo - Nigerian Male)",
      fn: async (t) => {
        const response = await axios.get(
          `https://api.streamelements.com/kappa/v2/speech?voice=Abeo&text=${encodeURIComponent(t.substring(0, 500))}`,
          { responseType: "arraybuffer", timeout: 30000 },
        );
        if (response.data && response.data.byteLength > 1000) {
          return Buffer.from(response.data);
        }
        return null;
      },
    },
    {
      name: "Voicerss (Nigerian English)",
      fn: async (t) => {
        const response = await axios.get(
          `https://api.voicerss.org/?key=2c97a8c6b1fc4c38b0aa2f5f9d7f3d7d&hl=en-ng&src=${encodeURIComponent(t)}&c=MP3`,
          { responseType: "arraybuffer", timeout: 30000 },
        );
        if (response.data && response.data.byteLength > 1000) {
          return Buffer.from(response.data);
        }
        return null;
      },
    },
    {
      name: "StreamElements (Brian - Backup)",
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
      name: "TTS API (Google Backup)",
      fn: async (t) => {
        const response = await axios.get(
          `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(t.substring(0, 200))}&tl=en-gb&client=tw-ob`,
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
 * Main voice command orchestration handler
 */
async function handleVoiceMessage(sock, chatId, message, senderId) {
  const isGroup = chatId.endsWith("@g.us");
  const isVoice = isVoiceMessage(message);
  const isImage = isImageMessage(message);

  if (!isVoice && !isImage) {
    return false;
  }

  // Initial checks for images to avoid intercepting other commands
  if (isImage) {
    const caption =
      message.message?.imageMessage?.caption ||
      message.message?.viewOnceMessageV2?.message?.imageMessage?.caption ||
      "";
    const botName = settings.botName?.toLowerCase() || "bot";
    const prefix = settings.prefix || ".";

    // Only handle image if: DM, or mentions bot, or specifically asked for voice
    const isBotMentioned =
      caption.toLowerCase().includes(botName) ||
      caption.toLowerCase().includes("samkiel");
    const isCommand = prefix !== "off" && caption.startsWith(prefix);

    if (isGroup && !isBotMentioned) return false;
    if (isCommand) return false; // Let commands handle it (like .sticker)
  }

  // Determine if it's a PTT (push to talk)
  const audioData = getAudioData(message);
  const isPtt = audioData?.ptt || false;

  console.log(
    `🎤 Voice Orchestration: Sender: ${senderId}, Type: ${isVoice ? "Audio" : "Image"}`,
  );

  // React to show we're processing (Reactions aren't prohibited text messages)
  try {
    await sock.sendMessage(chatId, { react: { text: "🎧", key: message.key } });
  } catch (e) {}

  let audioPath = null;
  let imagePath = null;

  try {
    if (isVoice) {
      audioPath = await downloadVoiceMessage(message, sock);
    } else if (isImage) {
      imagePath = await downloadImageMessage(message, sock);
    }

    if (!audioPath && !imagePath) {
      return true;
    }

    // Process with Mistral
    const result = await processVoiceWithMistral(audioPath, imagePath);

    if (result && result.text) {
      // Clean result text: No markdown, no emojis for voice mode
      let cleanText = result.text
        .replace(/[*_~`]/g, "") // Remove markdown
        .replace(
          /([\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c[\udd8e-\udd9a]|\ud83c[\udfe0-\udff0]|\ud83c[\udf00-\udfff]|\ud83d[\udc00-\udfff]|\ud83e[\udd00-\udfff])/g,
          "",
        ) // Remove emojis
        .trim();

      // Try to get audio response
      let audioBuffer = null;

      if (result.hasAudio && result.audio) {
        audioBuffer = Buffer.from(result.audio, "base64");
      } else {
        // Fallback to TTS (following "Mistral AI TTS" style/guidelines)
        audioBuffer = await textToSpeech(cleanText);
      }

      // Send voice response if we have audio
      if (audioBuffer) {
        // Attach transcription as caption (metadata)
        await sock.sendMessage(
          chatId,
          {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            ptt: true,
            caption: cleanText, // Transcription metadata
          },
          { quoted: message },
        );
        console.log("✅ Voice response sent");
      }

      // React success
      await sock.sendMessage(chatId, {
        react: { text: "✅", key: message.key },
      });
    }
  } catch (error) {
    console.error("Voice orchestration error:", error.message);
  } finally {
    if (audioPath) cleanupTempFile(audioPath);
    if (imagePath) cleanupTempFile(imagePath);
  }

  return true;
}

module.exports = {
  handleVoiceMessage,
  isVoiceMessage,
};
