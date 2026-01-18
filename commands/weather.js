/**
 * Weather Command - Real-time weather information
 * Multiple fallback APIs for reliability
 * No branding, rate limited
 */

const axios = require("axios");

const TIMEOUT = 10000;

/**
 * API 1: Open-Meteo (Primary - No Key Required)
 */
async function getOpenMeteo(city) {
  // First, geocode the city
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const geoRes = await axios.get(geoUrl, { timeout: TIMEOUT });

  if (!geoRes.data.results || geoRes.data.results.length === 0) {
    throw new Error("City not found");
  }

  const location = geoRes.data.results[0];
  const { latitude, longitude, name, country } = location;

  // Get weather
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
  const weatherRes = await axios.get(weatherUrl, { timeout: TIMEOUT });

  const current = weatherRes.data.current;
  const daily = weatherRes.data.daily;

  return {
    city: name,
    country: country,
    temp: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    tempMax: daily.temperature_2m_max[0],
    tempMin: daily.temperature_2m_min[0],
  };
}

/**
 * API 2: OpenWeatherMap (Fallback - Free Tier)
 */
async function getOpenWeatherMap(city) {
  const apiKey = "4902c0f2550f58298ad4146a92b65e10";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  const { data } = await axios.get(url, { timeout: TIMEOUT });

  return {
    city: data.name,
    country: data.sys.country,
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed * 3.6, // m/s to km/h
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    tempMax: data.main.temp_max,
    tempMin: data.main.temp_min,
  };
}

/**
 * API 3: wttr.in (Fallback - No Key Required, Text-based)
 */
async function getWttrIn(city) {
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  const current = data.current_condition[0];
  const area = data.nearest_area[0];

  return {
    city: area.areaName[0].value,
    country: area.country[0].value,
    temp: parseFloat(current.temp_C),
    feelsLike: parseFloat(current.FeelsLikeC),
    humidity: parseFloat(current.humidity),
    windSpeed: parseFloat(current.windspeedKmph),
    description: current.weatherDesc[0].value,
  };
}

/**
 * Get weather emoji based on code or description
 */
function getWeatherEmoji(data) {
  const desc = (data.description || "").toLowerCase();
  const code = data.weatherCode;

  // WMO Weather codes (Open-Meteo)
  if (code !== undefined) {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 49) return "🌫️";
    if (code <= 59) return "🌧️";
    if (code <= 69) return "🌨️";
    if (code <= 79) return "❄️";
    if (code <= 84) return "🌧️";
    if (code <= 94) return "⛈️";
    return "🌩️";
  }

  // Description-based
  if (desc.includes("clear") || desc.includes("sunny")) return "☀️";
  if (desc.includes("cloud")) return "⛅";
  if (desc.includes("rain") || desc.includes("drizzle")) return "🌧️";
  if (desc.includes("thunder") || desc.includes("storm")) return "⛈️";
  if (desc.includes("snow")) return "❄️";
  if (desc.includes("fog") || desc.includes("mist")) return "🌫️";
  return "🌤️";
}

/**
 * Get weather description from WMO code
 */
function getWeatherDescription(code) {
  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
  };
  return descriptions[code] || "Unknown";
}

async function weatherCommand(sock, chatId, city) {
  if (!city || city.trim().length === 0) {
    return await sock.sendMessage(chatId, {
      text: "🌤️ *Weather*\n\n*Usage:* weather <city>\n\n*Examples:*\n• weather Lagos\n• weather London\n• weather New York",
    });
  }

  let weatherData = null;
  let apiUsed = "";

  // Try Open-Meteo first (no API key, reliable)
  try {
    weatherData = await getOpenMeteo(city);
    weatherData.description = getWeatherDescription(weatherData.weatherCode);
    apiUsed = "Open-Meteo";
  } catch (e) {
    console.log("Weather: Open-Meteo failed, trying OpenWeatherMap...");
  }

  // Try OpenWeatherMap
  if (!weatherData) {
    try {
      weatherData = await getOpenWeatherMap(city);
      apiUsed = "OpenWeatherMap";
    } catch (e) {
      console.log("Weather: OpenWeatherMap failed, trying wttr.in...");
    }
  }

  // Try wttr.in
  if (!weatherData) {
    try {
      weatherData = await getWttrIn(city);
      apiUsed = "wttr.in";
    } catch (e) {
      console.log("Weather: All APIs failed");
    }
  }

  if (!weatherData) {
    return await sock.sendMessage(chatId, {
      text: `❌ Could not find weather for: *${city}*\n\nPlease check the city name and try again.`,
    });
  }

  const emoji = getWeatherEmoji(weatherData);

  // Build response
  let response = `${emoji} *Weather in ${weatherData.city}, ${weatherData.country}*\n\n`;
  response += `🌡️ *Temperature:* ${weatherData.temp.toFixed(1)}°C\n`;
  response += `🤔 *Feels Like:* ${weatherData.feelsLike.toFixed(1)}°C\n`;
  response += `☁️ *Condition:* ${weatherData.description}\n`;
  response += `💧 *Humidity:* ${weatherData.humidity}%\n`;
  response += `💨 *Wind:* ${weatherData.windSpeed.toFixed(1)} km/h\n`;

  if (weatherData.tempMax && weatherData.tempMin) {
    response += `\n📊 *Today's Range:*\n`;
    response += `├ High: ${weatherData.tempMax.toFixed(1)}°C\n`;
    response += `└ Low: ${weatherData.tempMin.toFixed(1)}°C`;
  }

  await sock.sendMessage(chatId, { text: response });
}

// Command metadata
weatherCommand.meta = {
  name: "weather",
  aliases: ["w", "forecast"],
  ownerOnly: false,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: true,
  ratelimited: true,
  silenceBlocked: true,
  description: "Get weather information",
};

module.exports = weatherCommand;
