/**
 * Crypto Command - Real-time cryptocurrency prices
 * Multiple fallback APIs for reliability
 * No branding, rate limited
 */

const axios = require("axios");

const TIMEOUT = 10000;

/**
 * API 1: CoinGecko (Primary - No Key Required)
 */
async function getCoinGecko(symbol) {
  const coinMap = {
    btc: "bitcoin",
    eth: "ethereum",
    bnb: "binancecoin",
    xrp: "ripple",
    ada: "cardano",
    sol: "solana",
    doge: "dogecoin",
    dot: "polkadot",
    matic: "matic-network",
    shib: "shiba-inu",
    ltc: "litecoin",
    avax: "avalanche-2",
    link: "chainlink",
    atom: "cosmos",
    uni: "uniswap",
  };

  const coinId = coinMap[symbol.toLowerCase()] || symbol.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;

  const { data } = await axios.get(url, { timeout: TIMEOUT });

  return {
    name: data.name,
    symbol: data.symbol.toUpperCase(),
    price: data.market_data.current_price.usd,
    change24h: data.market_data.price_change_percentage_24h,
    change7d: data.market_data.price_change_percentage_7d,
    marketCap: data.market_data.market_cap.usd,
    volume24h: data.market_data.total_volume.usd,
    high24h: data.market_data.high_24h.usd,
    low24h: data.market_data.low_24h.usd,
    rank: data.market_cap_rank,
    image: data.image?.small,
  };
}

/**
 * API 2: CoinCap (Fallback - No Key Required)
 */
async function getCoinCap(symbol) {
  const url = `https://api.coincap.io/v2/assets/${symbol.toLowerCase()}`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });
  const coin = data.data;

  return {
    name: coin.name,
    symbol: coin.symbol,
    price: parseFloat(coin.priceUsd),
    change24h: parseFloat(coin.changePercent24Hr),
    marketCap: parseFloat(coin.marketCapUsd),
    volume24h: parseFloat(coin.volumeUsd24Hr),
    rank: parseInt(coin.rank),
  };
}

/**
 * API 3: CoinPaprika (Fallback - No Key Required)
 */
async function getCoinPaprika(symbol) {
  const tickerMap = {
    btc: "btc-bitcoin",
    eth: "eth-ethereum",
    bnb: "bnb-binance-coin",
    xrp: "xrp-xrp",
    ada: "ada-cardano",
    sol: "sol-solana",
    doge: "doge-dogecoin",
  };

  const tickerId =
    tickerMap[symbol.toLowerCase()] ||
    `${symbol.toLowerCase()}-${symbol.toLowerCase()}`;
  const url = `https://api.coinpaprika.com/v1/tickers/${tickerId}`;

  const { data } = await axios.get(url, { timeout: TIMEOUT });

  return {
    name: data.name,
    symbol: data.symbol,
    price: data.quotes.USD.price,
    change24h: data.quotes.USD.percent_change_24h,
    change7d: data.quotes.USD.percent_change_7d,
    marketCap: data.quotes.USD.market_cap,
    volume24h: data.quotes.USD.volume_24h,
    rank: data.rank,
  };
}

/**
 * Format price with appropriate decimals
 */
function formatPrice(price) {
  if (price >= 1000)
    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(8)}`;
}

/**
 * Format large numbers
 */
function formatLargeNumber(num) {
  if (!num) return "N/A";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

/**
 * Format percentage change with emoji
 */
function formatChange(change) {
  if (change === undefined || change === null) return "N/A";
  const emoji = change >= 0 ? "📈" : "📉";
  const sign = change >= 0 ? "+" : "";
  return `${emoji} ${sign}${change.toFixed(2)}%`;
}

async function cryptoCommand(sock, chatId, message, args) {
  const symbol = args[0]?.toUpperCase() || "BTC";

  if (!symbol || symbol.length < 2 || symbol.length > 10) {
    return await sock.sendMessage(chatId, {
      text: "💰 *Crypto Prices*\n\n*Usage:* crypto <symbol>\n\n*Examples:*\n• crypto btc\n• crypto eth\n• crypto doge",
    });
  }

  let coinData = null;
  let apiUsed = "";

  // Try CoinGecko first
  try {
    coinData = await getCoinGecko(symbol);
    apiUsed = "CoinGecko";
  } catch (e) {
    console.log("Crypto: CoinGecko failed, trying CoinCap...");
  }

  // Try CoinCap
  if (!coinData) {
    try {
      coinData = await getCoinCap(symbol);
      apiUsed = "CoinCap";
    } catch (e) {
      console.log("Crypto: CoinCap failed, trying CoinPaprika...");
    }
  }

  // Try CoinPaprika
  if (!coinData) {
    try {
      coinData = await getCoinPaprika(symbol);
      apiUsed = "CoinPaprika";
    } catch (e) {
      console.log("Crypto: All APIs failed");
    }
  }

  if (!coinData) {
    return await sock.sendMessage(chatId, {
      text: `❌ Could not find cryptocurrency: *${symbol}*\n\nTry common symbols like: BTC, ETH, DOGE, SOL, XRP`,
    });
  }

  // Build response
  let response = `💰 *${coinData.name}* (${coinData.symbol})\n\n`;
  response += `💵 *Price:* ${formatPrice(coinData.price)}\n`;
  response += `📊 *24h Change:* ${formatChange(coinData.change24h)}\n`;

  if (coinData.change7d !== undefined) {
    response += `📈 *7d Change:* ${formatChange(coinData.change7d)}\n`;
  }

  response += `\n📊 *Market Data:*\n`;
  response += `├ Cap: ${formatLargeNumber(coinData.marketCap)}\n`;
  response += `├ Volume: ${formatLargeNumber(coinData.volume24h)}\n`;

  if (coinData.high24h) {
    response += `├ 24h High: ${formatPrice(coinData.high24h)}\n`;
    response += `├ 24h Low: ${formatPrice(coinData.low24h)}\n`;
  }

  if (coinData.rank) {
    response += `└ Rank: #${coinData.rank}\n`;
  }

  await sock.sendMessage(chatId, { text: response });
}

// Command metadata
cryptoCommand.meta = {
  name: "crypto",
  aliases: ["coin", "price"],
  ownerOnly: false,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: true,
  ratelimited: true,
  silenceBlocked: true,
  description: "Get cryptocurrency prices",
};

module.exports = cryptoCommand;
