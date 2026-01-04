const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err)
        return reject(
          new Error((stderr || stdout || err.message || "").toString())
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

async function updateViaGit(isForce = false) {
  // Safe-guard: Ensure we are fetching from the correct source
  try {
    await run(
      "git remote set-url origin https://github.com/samkiell/SAMKIEL-AI.git"
    );
  } catch (e) {}

  const oldRev = (
    await run("git rev-parse HEAD").catch(() => "unknown")
  ).trim();

  // 1. Fetch
  if (isForce) {
    console.log("➡️ [UPDATE] Force update detected. Fetching all...");
    await run("git fetch --all --prune");
  } else {
    console.log("➡️ [UPDATE] Fetching origin main...");
    await run("git fetch origin main");
  }

  // 2. Identify the target commit
  const newRev = (await run("git rev-parse origin/main")).trim();
  console.log(`➡️ [UPDATE] Target revision: ${newRev}`);

  const alreadyUpToDate = oldRev === newRev;

  // 3. Check for early exit (only if NOT forced)
  if (!isForce && alreadyUpToDate) {
    return { oldRev, newRev, alreadyUpToDate: true };
  }

  // 4. Reset & Clean Logic
  console.log("➡️ [UPDATE] Resetting to origin/main...");

  if (isForce) {
    // FORCE: Destructive reset as requested
    await run("git reset --hard origin/main");
    try {
      await run("git clean -fd");
    } catch (e) {
      console.log("Warning: git clean failed:", e.message);
    }
  } else {
    // NORMAL: Update safely
    await run("git checkout -B main origin/main");
    await run(`git reset --hard ${newRev}`);
    try {
      // Preserve data/session/.env in normal updates
      await run("git clean -fd -e data -e session -e .env");
    } catch (e) {
      console.log("Warning: git clean failed:", e.message);
    }
  }

  const commits =
    alreadyUpToDate && isForce
      ? ""
      : await run(
          `git log --pretty=format:"%h %s (%an)" ${oldRev}..${newRev}`
        ).catch(() => "");
  const files =
    alreadyUpToDate && isForce
      ? ""
      : await run(`git diff --name-status ${oldRev} ${newRev}`).catch(() => "");

  // Return alreadyUpToDate: false so the caller knows we performed an action (reinstall/update)
  return { oldRev, newRev, alreadyUpToDate: false, commits, files };
}

function getGithubParams(zipUrl) {
  // Extract owner and repo from: https://github.com/OWNER/REPO/archive/...
  const regex = /github\.com\/([^/]+)\/([^/]+)/;
  const match = zipUrl.match(regex);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

function fetchLatestCommit(owner, repo) {
  return new Promise((resolve) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits/main`;
    const client = require("https");
    const req = client.get(
      url,
      {
        headers: {
          "User-Agent": "SAMKIEL-BOT",
          Accept: "application/vnd.github.v3+json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            if (res.statusCode === 200) {
              const json = JSON.parse(data);
              resolve(json);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      }
    );

    req.on("error", () => resolve(null));

    // Add timeout to prevent hanging
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
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
            "User-Agent": "SAMKIEL BOT-Updater/1.0",
            Accept: "*/*",
          },
        },
        (res) => {
          // Handle redirects
          if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
            const location = res.headers.location;
            if (!location)
              return reject(
                new Error(`HTTP ${res.statusCode} without Location`)
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
        }
      );

      req.on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });

      // Add timeout for download
      req.setTimeout(20000, () => {
        req.destroy();
        fs.unlink(dest, () => reject(new Error("Download timed out")));
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
      "/"
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
    "No system unzip tool found (unzip/7z/busybox). Git mode is recommended on this panel."
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
  const zipOverrideStr = typeof zipOverride === "string" ? zipOverride : "";
  const zipUrl = (
    (zipOverrideStr.startsWith("http") ? zipOverrideStr : "") ||
    settings.updateZipUrl ||
    process.env.UPDATE_ZIP_URL ||
    ""
  ).trim();
  if (!zipUrl) {
    throw new Error(
      "No ZIP URL configured. Set settings.updateZipUrl or UPDATE_ZIP_URL env."
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
    // Preserve local configuration files
    "settings.js",
    "config.js",
    "lib/prefix.js", // Often contains default prefix logic, but prefix.json is in data/
    // If the user modified these source files locally and wants to keep them:
    // But usually updates SHOULD overwrite code.
    // The user specifically asked to keep "configurations" like welcome message state.
    // Those are stored in data/userGroupData.json which is inside 'data' folder
    // 'data' folder is ALREADY ignored above (line 254), so userGroupData.json is safe.

    // However, the user said "settings like welcome message".
    // If they mean settings.js (the file), we should ignore it if it exists.
    "settings.js",
  ];
  const copied = [];
  // Preserve ownerNumber from existing settings.js if present
  let preservedOwner = null;
  let preservedBotOwner = null;
  try {
    const currentSettings = require("../settings");
    preservedOwner =
      currentSettings && currentSettings.ownerNumber
        ? String(currentSettings.ownerNumber)
        : null;
    preservedBotOwner =
      currentSettings && currentSettings.ownerName
        ? String(currentSettings.ownerName)
        : null;
  } catch {}
  copyRecursive(srcRoot, process.cwd(), ignore, "", copied);
  if (preservedOwner) {
    try {
      const settingsPath = path.join(process.cwd(), "settings.js");
      if (fs.existsSync(settingsPath)) {
        let text = fs.readFileSync(settingsPath, "utf8");
        text = text.replace(
          /ownerNumber:\s*'[^']*'/,
          `ownerNumber: '${preservedOwner}'`
        );
        if (preservedBotOwner) {
          text = text.replace(
            /ownerName:\s*'[^']*'/,
            `ownerName: '${preservedBotOwner}'`
          );
        }
        fs.writeFileSync(settingsPath, text);
      }
    } catch {}
  }
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
      { text: "✅ Update complete! Restarting…", ...global.channelInfo },
      { quoted: message }
    );
  } catch {}
  try {
    // Preferred: PM2
    await run("pm2 restart all");
    return;
  } catch {}
  // Panels usually auto-restart when the process exits.
  // Exit after a short delay to allow the above message to flush.
  setTimeout(() => process.exit(0), 1000);
}

async function updateCommand(sock, chatId, message, zipOverride) {
  try {
    // 1. Parsing and Robust isForce Detection
    const rawText =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";
    const lowerText = rawText.toLowerCase();
    const isForce =
      lowerText.includes("--force") ||
      lowerText.includes("-f") ||
      lowerText.includes(" force");

    console.log(`[UPDATE] Force Enabled: ${isForce}`);

    // Check if update is possible
    const hasGit = await hasGitRepo();

    // Fallback logic for zipUrl if git is not used
    const zipOverrideStr = typeof zipOverride === "string" ? zipOverride : "";
    const hasZipUrl = (
      (zipOverrideStr.startsWith("http") ? zipOverrideStr : "") ||
      settings.updateZipUrl ||
      process.env.UPDATE_ZIP_URL ||
      ""
    ).trim();

    if (!hasGit && !hasZipUrl) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Update not configured!\n\nTo enable updates:\n• Set up a Git repository, OR\n• Configure updateZipUrl in settings.js, OR\n• Set UPDATE_ZIP_URL environment variable",
          ...global.channelInfo,
        },
        { quoted: message }
      );
      return;
    }

    // UX: Notify user
    await sock.sendMessage(
      chatId,
      {
        text: isForce
          ? "🔄 Force-updating from main branch..."
          : "🔄 Checking for updates...",
        ...global.channelInfo,
      },
      { quoted: message }
    );

    let updateReport = "";

    // 2. Perform Special Actions if Force
    if (isForce) {
      console.log(
        "[UPDATE] Force sync requested. Resetting config defaults..."
      );
      try {
        const settings = require("../settings");
        // Sync Prefix
        const { savePrefix } = require("../lib/prefix");
        savePrefix(settings.prefix || ".");

        // Sync Anti-Delete
        const antiDeletePath = path.join(process.cwd(), "data/antiDelete.json");
        if (fs.existsSync(antiDeletePath)) {
          try {
            fs.unlinkSync(antiDeletePath);
          } catch {}
        }

        // Sync Auto Status
        const autoStatusPath = path.join(process.cwd(), "data/autoStatus.json");
        if (fs.existsSync(autoStatusPath)) {
          try {
            fs.unlinkSync(autoStatusPath);
          } catch {}
        }
      } catch (e) {
        console.error("Force config reset error:", e);
      }
    }

    if (hasGit) {
      // 3. Run Git Update
      const { oldRev, newRev, alreadyUpToDate, commits, files } =
        await updateViaGit(isForce);

      // 4. Handle Results
      if (alreadyUpToDate && !isForce) {
        const currentPrefix = loadPrefix();
        const p = currentPrefix === "off" ? "." : currentPrefix;
        await sock.sendMessage(
          chatId,
          {
            text: `✅ *Already up to date*\n\nUse \`${p}update --force\` to force reinstall.`,
            ...global.channelInfo,
          },
          { quoted: message }
        );
        return;
      }

      // Generate Report
      if (isForce) {
        updateReport += `✅ *Force Reinstalled from Main Branch*\n\n`;
      } else {
        updateReport += `✅ *Update Completed Successfully!*\n\n`;
      }

      updateReport += `🚀 *Version:* \`${oldRev.substring(
        0,
        7
      )}\` ➔ \`${newRev.substring(0, 7)}\`\n\n`;

      if (commits) {
        const commitList = commits.split("\n").filter(Boolean);
        const recentCommits = commitList.slice(0, 5);
        updateReport +=
          `📝 *Recent Changes:*\n` +
          recentCommits.map((c) => `• ${c}`).join("\n");
        if (commitList.length > 5)
          updateReport += `\n...and ${commitList.length - 5} more`;
        updateReport += `\n\n`;
      }

      // Always reinstall dependencies if force or if changes detected
      await run("npm install --no-audit --no-fund");
    } else {
      // Zip Fallback
      const { copiedFiles } = await updateViaZip(
        sock,
        chatId,
        message,
        hasZipUrl
      );
      updateReport += `✅ *Update Installed Successfully* (Zip)\n\n`;
      updateReport += `📂 *Files Updated:* ${copiedFiles.length}\n`;
    }

    // Send final report
    await sock.sendMessage(
      chatId,
      { text: updateReport, ...global.channelInfo },
      { quoted: message }
    );

    // Restart
    try {
      await sock.sendMessage(chatId, {
        text: `🔄 Restarting...`,
        ...global.channelInfo,
      });
    } catch {}

    await restartProcess(sock, chatId, message);
  } catch (err) {
    console.error("Update failed:", err);
    try {
      await sock.sendMessage(
        chatId,
        {
          text: `❌ Update failed:\n${String(err.message || err)}`,
          ...global.channelInfo,
        },
        { quoted: message }
      );
    } catch (e) {}
  }
}

module.exports = updateCommand;
