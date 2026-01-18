const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generates a PDF from the provided text and sends it to the chat.
 * @param {import("@whiskeysockets/baileys").WASocket} sock
 * @param {string} chatId
 * @param {string} text
 * @param {any} message
 */
async function pdfCommand(sock, chatId, text, message) {
  let pdfPath = null;
  const tempDir = path.join(__dirname, "../temp");

  try {
    // 1. Send initial message & start animation
    const initialMsg = await sock.sendMessage(
      chatId,
      { text: "📑 Generating PDF..." },
      { quoted: message },
    );
    const key = initialMsg.key;

    // Loading animation
    const loaders = [
      "⬜⬜⬜⬜⬜ 0%",
      "🟩⬜⬜⬜⬜ 20%",
      "🟩🟩⬜⬜⬜ 40%",
      "🟩🟩🟩⬜⬜ 60%",
      "🟩🟩🟩🟩⬜ 80%",
      "🟩🟩🟩🟩🟩 100%",
    ];

    let animationPromise = (async () => {
      for (const loader of loaders) {
        await new Promise((r) => setTimeout(r, 600)); // Delay for animation
        await sock.sendMessage(chatId, {
          text: `📑 Generating PDF...\n${loader}`,
          edit: key,
        });
      }
    })();

    console.log("➡️ [PDF COMMAND] Starting generation...");
    console.log(`➡️ [PDF COMMAND] Text length: ${text.length} characters`);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      console.log("➡️ [PDF COMMAND] Creating temp directory...");
      fs.mkdirSync(tempDir, { recursive: true });
    }

    pdfPath = path.join(tempDir, `samkielbot-${Date.now()}.pdf`);
    console.log(`➡️ [PDF COMMAND] PDF path will be: ${pdfPath}`);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(pdfPath);

    // Font support for emojis
    const emojiFonts = [
      "C:/Windows/Fonts/seguiemj.ttf", // Windows 10+
      "C:/Windows/Fonts/Segoe UI Emoji/seguiemj.ttf", // Windows Alternative
      "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", // Linux (Ubuntu/Debian)
      "/usr/share/fonts/opentype/noto/NotoColorEmoji.ttf", // Linux Alternative
      "/usr/share/fonts/google-noto-emoji-fonts/NotoColorEmoji.ttf", // Fedora
      "/System/Library/Fonts/Apple Color Emoji.ttc", // macOS
      "/System/Library/Fonts/Apple Color Emoji.ttf", // macOS Alternative
    ];

    let fontLoaded = false;
    for (const fontPath of emojiFonts) {
      if (fs.existsSync(fontPath)) {
        try {
          doc.font(fontPath);
          fontLoaded = true;
          console.log(`➡️ [PDF COMMAND] Using font: ${fontPath}`);
          break;
        } catch (e) {
          console.error(
            `❌ [PDF COMMAND] Error loading font ${fontPath}:`,
            e.message,
          );
        }
      }
    }

    if (!fontLoaded) {
      console.warn(
        "⚠️ [PDF COMMAND] No emoji font found, falling back to Helvetica",
      );
      doc.font("Helvetica");
    }

    // Error handling for stream
    stream.on("error", (err) => {
      console.error("❌ [PDF COMMAND] Stream Error:", err);
    });

    doc.pipe(stream);

    // Event listener to add footer to EVERY page automatically
    doc.on("pageAdded", () => {
      addFooter(doc);
    });

    // Add footer to the first page manually
    addFooter(doc);

    // Add content
    doc.fontSize(12).text(text, {
      align: "left",
      lineGap: 5,
      paragraphGap: 10,
    });

    function addFooter(doc) {
      const oldBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const oldX = doc.x;
      const oldY = doc.y;

      doc.save();

      // --- WATERMARK START ---
      doc.save();
      doc.opacity(0.1); // Low opacity
      doc.fontSize(50); // Large font
      doc.fillColor("black");

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Rotate 45 degrees around center
      doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] }); // Negative for standard diagonal up-left to down-right usually looks better, but prompt said 45. Let's stick to 45 (up-right) or -45. Prompt said approx 45.
      // Actually standard watermark usually goes bottom-left to top-right which is -45 in some coord systems or 45 in others. PDFKit rotation is clockwise.
      // Let's do -45 (counter-clockwise) to go bottom-left to top-right. Or 45 for top-left to bottom-right.
      // "Slanted (approx 45)".

      doc.text("SAMKIELBOT", 0, pageHeight / 2, {
        width: pageWidth,
        align: "center",
        valign: "center",
      });

      doc.restore();
      // --- WATERMARK END ---

      const bottom = doc.page.height - 50;

      doc
        .fontSize(10)
        .fillColor("black")
        .opacity(1) // Normal opacity for footer
        .text("www.samkielbot.app", 50, bottom, {
          align: "center",
          width: doc.page.width - 100,
          link: "https://www.samkielbot.app",
          underline: false,
        });

      doc.restore();
      doc.x = oldX;
      doc.y = oldY;
      doc.page.margins.bottom = oldBottomMargin;
    }

    console.log("➡️ [PDF COMMAND] Finalizing document...");
    doc.end();

    // Wait for the stream to finish writing
    await new Promise((resolve, reject) => {
      stream.on("finish", () => {
        console.log("➡️ [PDF COMMAND] Write stream finished.");
        resolve();
      });
      stream.on("error", (err) => {
        console.error("❌ [PDF COMMAND] Stream error during promise:", err);
        reject(err);
      });
    });

    // Final verification
    if (!fs.existsSync(pdfPath)) {
      throw new Error(
        "PDF file was not created successfully after stream finish.",
      );
    }

    const stats = fs.statSync(pdfPath);
    console.log(`➡️ [PDF COMMAND] File size: ${stats.size} bytes`);

    if (stats.size === 0) {
      throw new Error("Generated PDF is empty (0 bytes).");
    }

    // Ensure animation finishes visually
    await animationPromise;

    // Update message to show completion
    await sock.sendMessage(chatId, {
      text: "✅ Generated!",
      edit: key,
    });

    console.log("➡️ [PDF COMMAND] Sending file via Baileys...");
    await sock.sendMessage(
      chatId,
      {
        document: { url: pdfPath },
        fileName: `samkielbot-pdf_${message.pushName || "User"}.pdf`,
        mimetype: "application/pdf",
        caption: "✅ PDF Generated Successfully",
        contextInfo: global.channelInfo?.contextInfo || {},
      },
      { quoted: message },
    );

    console.log("✅ [PDF COMMAND] PDF sent successfully.");
  } catch (error) {
    console.error("❌ [PDF COMMAND] Fatal Error:", error);

    // Provide user-friendly error message
    await sock.sendMessage(
      chatId,
      {
        text: `❌ *PDF Error*\n\nAn error occurred while generating your PDF. Please try again later.\n\n*Error:* ${error.message}`,
      },
      { quoted: message },
    );
  } finally {
    // Cleanup
    if (pdfPath && fs.existsSync(pdfPath)) {
      try {
        fs.unlinkSync(pdfPath);
        console.log("➡️ [PDF COMMAND] Temporary file cleaned up.");
      } catch (e) {
        console.error("❌ [PDF COMMAND] Cleanup error:", e);
      }
    }
  }
}

module.exports = pdfCommand;
