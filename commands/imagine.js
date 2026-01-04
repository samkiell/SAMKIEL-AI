const axios = require("axios");
const { loadPrefix } = require("../lib/prefix");

async function imagineCommand(sock, chatId, message) {
  try {
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    // Get the prompt from the message
    const prompt =
      message.message?.conversation?.trim() ||
      message.message?.extendedTextMessage?.text?.trim() ||
      "";

    // Remove the command prefix and trim using regex split to be safe
    const parts = prompt.split(/\s+/);
    const imagePrompt = parts.slice(1).join(" ").trim();

    if (!imagePrompt) {
      await sock.sendMessage(
        chatId,
        {
          text: `Please provide a prompt for the image generation.\nExample: ${p}imagine a Picture Of Elon Musk`,
          ...global.channelInfo,
        },
        {
          quoted: message,
        }
      );
      return;
    }

    // Send processing message with animation
    const initialMsg = await sock.sendMessage(
      chatId,
      {
        text: "🎨 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 is Generating your image...",
        ...global.channelInfo,
      },
      { quoted: message }
    );
    const key = initialMsg.key;

    const loaders = [
      "⬜⬜⬜⬜⬜ 0%",
      "🟩⬜⬜⬜⬜ 20%",
      "🟩🟩⬜⬜⬜ 40%",
      "🟩🟩🟩⬜⬜ 60%",
      "🟩🟩🟩🟩⬜ 80%",
      "🟩🟩🟩🟩🟩 100%",
    ];

    let loading = true;
    const animateLoading = async () => {
      while (loading) {
        for (const loader of loaders) {
          if (!loading) break;
          await new Promise((r) => setTimeout(r, 600));
          await sock.sendMessage(chatId, {
            text: `🎨 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 is Generating your image...\n${loader}`,
            edit: key,
          });
        }
      }
    };
    const animationPromise = animateLoading();

    const stopAnimation = async () => {
      loading = false;
      await animationPromise;
      await sock
        .sendMessage(chatId, { text: "✅ Generated!", edit: key })
        .catch(() => {});
    };

    // Enhance the prompt with quality keywords
    const enhancedPrompt = enhancePrompt(imagePrompt);

    // Make API request
    const response = await axios.get(
      `https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=${encodeURIComponent(
        enhancedPrompt
      )}`,
      {
        responseType: "arraybuffer",
      }
    );

    // Check if response contains valid image data
    if (!response.data || response.data.length === 0) {
      throw new Error("Empty response from image generation API");
    }

    // Send the generated image
    await stopAnimation();
    await sock.sendMessage(
      chatId,
      {
        image: response.data, // Directly use the arraybuffer
        caption: `🎨 Image Generated Successfully \n Prompt was: "${imagePrompt}"`,
      },
      {
        quoted: message,
      }
    );
  } catch (error) {
    console.error("Error in imagine command:", error);
    let errorMessage = "❌ Failed to generate image. Please try again later.";

    if (error.response?.status === 429) {
      errorMessage = "❌ Too many requests. Please try again later.";
    } else if (error.code === "ECONNABORTED") {
      errorMessage = "❌ Request timed out. Please try again.";
    }

    await stopAnimation();
    await sock.sendMessage(
      chatId,
      {
        text: errorMessage,
      },
      {
        quoted: message,
      }
    );
  }
}

// Function to enhance the prompt
function enhancePrompt(prompt) {
  // Quality enhancing keywords
  const qualityEnhancers = [
    "high quality",
    "detailed",
    "masterpiece",
    "best quality",
    "ultra realistic",
    "4k",
    "highly detailed",
    "professional photography",
    "cinematic lighting",
    "sharp focus",
  ];

  // Randomly select 3-4 enhancers
  const numEnhancers = Math.floor(Math.random() * 2) + 3; // Random number between 3-4
  const selectedEnhancers = qualityEnhancers
    .sort(() => Math.random() - 0.5)
    .slice(0, numEnhancers);

  // Combine original prompt with enhancers
  return `${prompt}, ${selectedEnhancers.join(", ")}`;
}

module.exports = imagineCommand;
