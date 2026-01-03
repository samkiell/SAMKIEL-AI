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

    // Error handling for stream
    stream.on("error", (err) => {
      console.error("❌ [PDF COMMAND] Stream Error:", err);
    });

    doc.pipe(stream);

    // Add some styling or header if you want, but keep it simple for now
    doc
      .fontSize(20)
      .text("Generated PDF Document by SAMKIEL BOT ! www.samkielbot.app", {
        align: "center",
      });
    doc.moveDown();
    doc.fontSize(12).text(text, {
      align: "justify",
      lineGap: 2,
    });

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
        "PDF file was not created successfully after stream finish."
      );
    }

    const stats = fs.statSync(pdfPath);
    console.log(`➡️ [PDF COMMAND] File size: ${stats.size} bytes`);

    if (stats.size === 0) {
      throw new Error("Generated PDF is empty (0 bytes).");
    }

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
      { quoted: message }
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
      { quoted: message }
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
