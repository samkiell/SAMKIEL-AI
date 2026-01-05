const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const settings = require("../settings");

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

async function updateViaGit() {
  const oldRev = (
    await run("git rev-parse HEAD").catch(() => "unknown")
  ).trim();

  // Explicitly fetch origin main to ensure we have the target
  await run("git fetch origin main");
  await run("git fetch --all --prune");

  const newRev = (await run("git rev-parse origin/main")).trim();
  const alreadyUpToDate = oldRev === newRev;

  const commits = alreadyUpToDate
    ? ""
    : await run(
        `git log --pretty=format:"%h %s (%an)" ${oldRev}..${newRev}`
      ).catch(() => "");
  const files = alreadyUpToDate
    ? ""
    : await run(`git diff --name-status ${oldRev} ${newRev}`).catch(() => "");

  // CRITICAL FIX: Force switch to 'main' branch and reset to origin/main
  // This ensures we are not stuck on a deployment branch like 'deploy-123'
  await run("git checkout -B main origin/main");

  try {
    // Clean but preserve critical data
    await run("git clean -fd -e data -e session -e .env");
  } catch (e) {
    console.log(
      "Warning: git clean failed, possibly due to locked files:",
      e.message
    );
  }
  return { oldRev, newRev, alreadyUpToDate, commits, files };
}

function getGithubParams(zipUrl) {
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
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function downloadFile(url, dest, visited = new Set()) {
  return new Promise((resolve, reject) => {
    try {
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
  if (process.platform === "win32") {
    const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(
      /\\/g,
      "/"
    )}' -Force"`;
    await run(cmd);
    return;
  }
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
  throw new Error("No system unzip tool found (unzip/7z/busybox).");
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
    zipOverrideStr ||
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

  const [root] = fs.readdirSync(extractTo).map((n) => path.join(extractTo, n));
  const srcRoot =
    fs.existsSync(root) && fs.lstatSync(root).isDirectory() ? root : extractTo;

  const ignore = [
    "node_modules",
    ".git",
    "session",
    "tmp",
    "tmp/",
    "temp",
    "data",
    "baileys_store.json",
  ];
  const copied = [];
  let preservedOwner = null;
  let preservedBotOwner = null;
  try {
    const currentSettings = require("../settings");
    preservedOwner = currentSettings?.ownerNumber
      ? String(currentSettings.ownerNumber)
      : null;
    preservedBotOwner = currentSettings?.ownerName
      ? String(currentSettings.ownerName)
      : null;
  } catch {}

  copyRecursive(srcRoot, process.cwd(), ignore, "", copied);

  // Restore owner info to settings.js if it was overwritten
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
    await run("pm2 restart all");
    return;
  } catch {}
  setTimeout(() => process.exit(0), 1000);
}

async function updateCommand(sock, chatId, message, zipOverride) {
  try {
    const hasGit = await hasGitRepo();
    const zipOverrideStr = typeof zipOverride === "string" ? zipOverride : "";
    const hasZipUrl = (
      zipOverrideStr ||
      settings.updateZipUrl ||
      process.env.UPDATE_ZIP_URL ||
      ""
    ).trim();

    // Check for --force flag
    const rawText =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";
    const isForce = rawText.toLowerCase().includes("--force");

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

    await sock.sendMessage(
      chatId,
      { text: "🔄 Check for updates...", ...global.channelInfo },
      { quoted: message }
    );

    let updateReport = "";

    if (hasGit) {
      const { oldRev, newRev, alreadyUpToDate, commits, files } =
        await updateViaGit();

      // If already up to date and NOT forcing, return early
      if (alreadyUpToDate && !isForce) {
        await sock.sendMessage(
          chatId,
          {
            text: `✅ *Already up to date* \nCurrent Version: \`${newRev.substring(
              0,
              7
            )}\`\nUse *update --force* to reinstall.`,
            ...global.channelInfo,
          },
          { quoted: message }
        );
        return;
      }

      updateReport += `✅ *Update Completed Successfully!* \n\n`;
      updateReport += `🚀 *Version:* \`${oldRev.substring(
        0,
        7
      )}\` ➔ \`${newRev.substring(0, 7)}\`\n\n`;

      if (commits) {
        const commitList = commits.split("\n").filter(Boolean);
        const recentCommits = commitList.slice(0, 5);
        updateReport += `📝 *Recent Changes:*\n`;
        updateReport += recentCommits.map((c) => `• ${c}`).join("\n");
        if (commitList.length > 5)
          updateReport += `\n...and ${commitList.length - 5} more commits`;
        updateReport += `\n\n`;
      }

      if (files) {
        const fileList = files.split("\n").filter(Boolean);
        const changedFiles = fileList.slice(0, 5);
        updateReport += `📂 *Modified Files:*\n`;
        updateReport += changedFiles.map((f) => `• ${f}`).join("\n");
        if (fileList.length > 5)
          updateReport += `\n...and ${fileList.length - 5} more files`;
      }

      await run("npm install --no-audit --no-fund");
    } else {
      const { copiedFiles } = await updateViaZip(
        sock,
        chatId,
        message,
        zipOverride
      );

      let commitMsg = null;
      try {
        const repoParams = getGithubParams(hasZipUrl);
        if (repoParams) {
          const commitData = await fetchLatestCommit(
            repoParams.owner,
            repoParams.repo
          );
          if (commitData) commitMsg = commitData.commit.message;
        }
      } catch (err) {}

      updateReport += `✅ *Update Installed Successfully* (Zip)\n\n`;
      if (commitMsg) updateReport += `📝 *Latest Commit:*\n${commitMsg}\n\n`;
      updateReport += `📂 *Files Updated:* ${copiedFiles.length}\n`;
    }

    await sock.sendMessage(
      chatId,
      { text: updateReport, ...global.channelInfo },
      { quoted: message }
    );
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
