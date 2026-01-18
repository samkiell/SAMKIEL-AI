const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const settings = require("../settings");
const { isOwner: checkOwner } = require("../lib/isOwner");
const { sendText } = require("../lib/sendResponse");

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err)
        return reject(
          new Error((stderr || stdout || err.message || "").toString()),
        );
      resolve((stdout || "").toString());
    });
  });
}

async function hasGitRepo() {
  const gitDir = path.join(process.cwd(), ".git");
  if (!fs.existsSync(gitDir)) return false;
  try {
    await run("git --version");
    return true;
  } catch {
    return false;
  }
}

async function updateViaGit() {
  const oldRev = (
    await run("git rev-parse HEAD").catch(() => "unknown")
  ).trim();
  await run("git fetch --all --prune");

  // Try to find the default branch (usually main or master)
  let branch = "main";
  try {
    const remoteInfo = await run("git remote show origin");
    const match = remoteInfo.match(/HEAD branch: (.*)/);
    if (match) branch = match[1].trim();
  } catch {
    // Fallback to main
  }

  const newRev = (await run(`git rev-parse origin/${branch}`)).trim();
  const alreadyUpToDate = oldRev === newRev;

  if (alreadyUpToDate) {
    return { oldRev, newRev, alreadyUpToDate: true };
  }

  const commits = await run(
    `git log --pretty=format:"%h %s" ${oldRev}..${newRev} -n 5`,
  ).catch(() => "");

  const files = await run(`git diff --name-status ${oldRev} ${newRev}`).catch(
    () => "",
  );

  // 🛡️ Safe Update Strategy:
  // 1. Stash any local modifications (including untracked files if any)
  await run("git stash -u").catch(() => {});

  // 2. Force reset to the new revision
  await run(`git reset --hard ${newRev}`);

  // 3. Clean untracked files but PROTECT config/data folders
  // -e excludes patterns from being deleted
  await run(
    "git clean -fd -e data/ -e session/ -e settings.js -e .env -e owner.json",
  ).catch(() => {});

  // 4. Try to restore local configurations/data
  await run("git stash pop").catch(() => {
    // If pop fails due to conflicts, we keep the updated repo version
    // but the local changes remain in the stash for manual recovery if needed.
    console.warn(
      "Update: Local changes had conflicts with the update and were kept in stash.",
    );
  });

  return { oldRev, newRev, alreadyUpToDate: false, commits, files };
}

function downloadFile(url, dest, visited = new Set()) {
  return new Promise((resolve, reject) => {
    try {
      // Avoid infinite redirect loops
      if (visited.has(url) || visited.size > 5) {
        return reject(new Error("Too many redirects"));
      }
      visited.add(url);

      const useHttps = url.startsWith("https://");
      const client = useHttps ? require("https") : require("http");
      const req = client.get(
        url,
        {
          headers: {
            "User-Agent": "KnightBot-Updater/1.0",
            Accept: "*/*",
          },
        },
        (res) => {
          // Handle redirects
          if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
            const location = res.headers.location;
            if (!location)
              return reject(
                new Error(`HTTP ${res.statusCode} without Location`),
              );
            const nextUrl = new URL(location, url).toString();
            res.resume();
            return downloadFile(nextUrl, dest, visited)
              .then(resolve)
              .catch(reject);
          }

          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }

          const file = fs.createWriteStream(dest);
          res.pipe(file);
          file.on("finish", () => file.close(resolve));
          file.on("error", (err) => {
            try {
              file.close(() => {});
            } catch {}
            fs.unlink(dest, () => reject(err));
          });
        },
      );
      req.on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function extractZip(zipPath, outDir) {
  // Try to use platform tools; no extra npm modules required
  if (process.platform === "win32") {
    const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(
      /\\/g,
      "/",
    )}' -Force"`;
    await run(cmd);
    return;
  }
  // Linux/mac: try unzip, else 7z, else busybox unzip
  try {
    await run("command -v unzip");
    await run(`unzip -o '${zipPath}' -d '${outDir}'`);
    return;
  } catch {}
  try {
    await run("command -v 7z");
    await run(`7z x -y '${zipPath}' -o'${outDir}'`);
    return;
  } catch {}
  try {
    await run("busybox unzip -h");
    await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`);
    return;
  } catch {}
  throw new Error(
    "No system unzip tool found (unzip/7z/busybox). Git mode is recommended on this panel.",
  );
}

function copyRecursive(src, dest, ignore = [], relative = "", outList = []) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (ignore.includes(entry)) continue;
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) {
      copyRecursive(s, d, ignore, path.join(relative, entry), outList);
    } else {
      fs.copyFileSync(s, d);
      if (outList) outList.push(path.join(relative, entry).replace(/\\/g, "/"));
    }
  }
}

async function updateViaZip(sock, chatId, message, zipOverride) {
  const zipUrl = (
    zipOverride ||
    settings.updateZipUrl ||
    process.env.UPDATE_ZIP_URL ||
    ""
  ).trim();
  if (!zipUrl) {
    throw new Error(
      "No ZIP URL configured. Set settings.updateZipUrl or UPDATE_ZIP_URL env.",
    );
  }
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const zipPath = path.join(tmpDir, "update.zip");
  await downloadFile(zipUrl, zipPath);
  const extractTo = path.join(tmpDir, "update_extract");
  if (fs.existsSync(extractTo))
    fs.rmSync(extractTo, { recursive: true, force: true });
  await extractZip(zipPath, extractTo);

  // Find the top-level extracted folder (GitHub zips create REPO-branch folder)
  const [root] = fs.readdirSync(extractTo).map((n) => path.join(extractTo, n));
  const srcRoot =
    fs.existsSync(root) && fs.lstatSync(root).isDirectory() ? root : extractTo;

  // Copy over while preserving runtime dirs/files
  const ignore = [
    "node_modules",
    ".git",
    "session",
    "tmp",
    "tmp/",
    "temp",
    "data",
    "baileys_store.json",
    "settings.js",
    ".env",
    "owner.json",
  ];
  const copied = [];

  // Copy new files
  copyRecursive(srcRoot, process.cwd(), ignore, "", copied);

  // Cleanup extracted directory
  try {
    fs.rmSync(extractTo, { recursive: true, force: true });
  } catch {}
  try {
    fs.rmSync(zipPath, { force: true });
  } catch {}
  return { copiedFiles: copied };
}

async function restartProcess(sock, chatId, message) {
  try {
    await sock.sendMessage(
      chatId,
      { text: "✅ Update complete! Restarting…" },
      { quoted: message },
    );
  } catch {}
  try {
    // Preferred: PM2
    await run("pm2 restart all");
    return;
  } catch {}
  // Panels usually auto-restart when the process exits.
  // Exit after a short delay to allow the above message to flush.
  setTimeout(() => {
    process.exit(0);
  }, 500);
}

async function updateCommand(sock, chatId, message, zipOverride) {
  const senderId = message.key.participant || message.key.remoteJid;
  const isOwner = await checkOwner(senderId);

  if (!message.key.fromMe && !isOwner) {
    await sock.sendMessage(
      chatId,
      { text: "Only bot owner or sudo can use .update" },
      { quoted: message },
    );
    return;
  }
  try {
    // Minimal UX
    await sock.sendMessage(
      chatId,
      { text: "🔄 Updating the bot, please wait…" },
      { quoted: message },
    );

    if (await hasGitRepo()) {
      // silent
      const { oldRev, newRev, alreadyUpToDate, commits, files } =
        await updateViaGit();

      const shortNewRev =
        typeof newRev === "string" ? newRev.slice(0, 7) : newRev;

      let updateInfo = "";
      if (alreadyUpToDate) {
        updateInfo = `✅ Already up to date: ${shortNewRev}`;
      } else {
        updateInfo = `✅ Updated to: ${shortNewRev}\n\n*Recent Changes SC:*\n${commits || "No commit details available."}`;
      }

      await run("npm install --no-audit --no-fund");

      await sendText(sock, chatId, updateInfo + "\n\nRestarting…", {
        quoted: message,
      });
    } else {
      const { copiedFiles } = await updateViaZip(
        sock,
        chatId,
        message,
        zipOverride,
      );
      await sendText(sock, chatId, `✅ Update done via ZIP. Restarting…`, {
        quoted: message,
      });
    }
    await restartProcess(sock, chatId, message);
  } catch (err) {
    console.error("Update failed:", err);
    await sendText(
      sock,
      chatId,
      `❌ Update failed:\n${String(err.message || err)}`,
      { quoted: message },
    );
  }
}

module.exports = updateCommand;
