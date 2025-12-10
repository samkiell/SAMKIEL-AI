// Complete CRUD functionality for premuim users

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/premium.json");

function loadPremium() {
  const raw = fs.readFileSync(filePath);
  return JSON.parse(raw);
}

function savePremium(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function isPremium(jid) {
  const data = loadPremium();
  return data.users.some((u) => u.jid === jid);
}

function addPremium(jid, number) {
  const data = loadPremium();
  if (!data.users.some((u) => u.jid === jid)) {
    data.users.push({ jid, number });
    savePremium(data);
  }
}

function removePremium(jid) {
  const data = loadPremium();
  data.users = data.users.filter((u) => u.jid !== jid);
  savePremium(data);
}

module.exports = { isPremium, addPremium, removePremium, loadPremium };
