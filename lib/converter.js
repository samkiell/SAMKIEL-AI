const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function ffmpeg(buffer, args = [], ext = "", ext2 = "") {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if ffmpeg exists in path
      const check = spawn("ffmpeg", ["-version"]);
      check.on("error", () => {
        reject(new Error("ffmpeg not found! Please install ffmpeg to use audio features."));
      });
      check.on("close", async (code) => {
        if (code !== 0 && code !== 1) { // some versions return 1 for -version
           // continue anyway if it didn't error immediately
        }
        
        // Original logic
        let databasePath = path.join(__dirname, "../database");
        if (!fs.existsSync(databasePath)) {
          fs.mkdirSync(databasePath, { recursive: true });
        }
        let tmp = path.join(databasePath, +new Date() + "." + ext);
        let out = tmp + "." + ext2;
        await fs.promises.writeFile(tmp, buffer);
        spawn("ffmpeg", ["-y", "-i", tmp, ...args, out])
          .on("error", reject)
          .on("close", async (code) => {
            try {
              await fs.promises.unlink(tmp);
              if (code !== 0) return reject(new Error(`ffmpeg exited with code ${code}`));
              resolve(await fs.promises.readFile(out));
              await fs.promises.unlink(out);
            } catch (e) {
              reject(e);
            }
          });
      });
    } catch (e) {
      reject(e);
    }
  });
}


/**
 * Convert Audio to Playable WhatsApp Audio
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension
 */
function toAudio(buffer, ext) {
  return ffmpeg(
    buffer,
    ["-vn", "-ac", "2", "-b:a", "128k", "-ar", "44100", "-f", "mp3"],
    ext,
    "mp3",
  );
}

/**
 * Convert Audio to Playable WhatsApp PTT
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension
 */
function toPTT(buffer, ext) {
  return ffmpeg(
    buffer,
    [
      "-vn",
      "-c:a",
      "libopus",
      "-b:a",
      "128k",
      "-vbr",
      "on",
      "-compression_level",
      "10",
    ],
    ext,
    "opus",
  );
}

/**
 * Convert Audio to Playable WhatsApp Video
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext File Extension
 */
function toVideo(buffer, ext) {
  return ffmpeg(
    buffer,
    [
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-ab",
      "128k",
      "-ar",
      "44100",
      "-crf",
      "32",
      "-preset",
      "slow",
    ],
    ext,
    "mp4",
  );
}

module.exports = {
  toAudio,
  toPTT,
  toVideo,
  ffmpeg,
};
