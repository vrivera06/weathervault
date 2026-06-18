// Generate daily weather data for a date range
function generateDailyData(startDate, days, baseTempF, baseHumidity) {
  const data = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    // Add seasonal variation + noise
    const seasonalTemp = Math.sin((i / days) * Math.PI) * 8;
    const noise = (Math.random() - 0.5) * 6;
    const humidNoise = (Math.random() - 0.5) * 12;
    const windVal = Math.round((8 + Math.random() * 12) * 10) / 10;
    const tempVal = Math.round((baseTempF + seasonalTemp + noise) * 10) / 10;
    const rainVal = Math.round(Math.max(0, (Math.random() - 0.7) * 0.5) * 100) / 100;
    data.push({
      date: dateStr,
      // NOAA field names (used by Dashboard, CorrelativeGraphs)
      air_temp: tempVal,
      temp_f: tempVal,
      wind_speed: windVal,
      max_wind_speed: Math.round((windVal + Math.random() * 5) * 10) / 10,
      wind_dir: Math.round(Math.random() * 360),
      rain: rainVal,
      condition: pickCondition(baseHumidity + humidNoise),
      // Legacy aliases kept for any remaining references
      tempF: tempVal,
      windMph: windVal,
      humidity: Math.min(95, Math.max(30, Math.round(baseHumidity + humidNoise))),
    });
  }
  return data;
}

function pickCondition(humidity) {
  if (humidity > 75) return 'Rainy';
  if (humidity > 60) return 'Cloudy';
  if (humidity > 45) return 'Partly Cloudy';
  return 'Sunny';
}

export const CITY = 'Pleasantville';

// 2025 daily data (past year)
export const dailyData2025 = generateDailyData('2025-06-01', 45, 74, 58);

// 2026 daily data (current)
export const dailyData2026 = generateDailyData('2026-06-01', 15, 76, 61);

// Current conditions (latest entry) — uses NOAA field names to match backend schema
export const currentWeather = {
  station: 'JFK International Airport',
  date: '2026-06-15',
  air_temp: 78.4,
  temp_f: 78.4,
  rain: 0.0,
  wind_speed: 11.2,
  max_wind_speed: 15.8,
  wind_dir: 220,
  condition: 'Partly Cloudy',
  // legacy aliases
  city: CITY,
  tempF: 78.4,
  windMph: 11.2,
  humidity: 63,
};

// Weekly aggregates for Past Models table
export const weeklyHistory = [
  { week: 'Jun 9–15, 2026', avgTempF: 77.2, maxTempF: 84.1, minTempF: 69.8, avgHumidity: 62, condition: 'Partly Cloudy', tempChangePct: 2.4, humidChangePct: -3.1 },
  { week: 'Jun 2–8, 2026',  avgTempF: 75.3, maxTempF: 81.7, minTempF: 68.4, avgHumidity: 64, condition: 'Cloudy',        tempChangePct: -1.8, humidChangePct: 5.6 },
  { week: 'May 26–Jun 1, 2026', avgTempF: 76.7, maxTempF: 83.2, minTempF: 70.1, avgHumidity: 61, condition: 'Sunny', tempChangePct: 4.2, humidChangePct: -2.0 },
  { week: 'May 19–25, 2026', avgTempF: 73.6, maxTempF: 79.8, minTempF: 66.9, avgHumidity: 62, condition: 'Partly Cloudy', tempChangePct: 1.1, humidChangePct: 1.4 },
  { week: 'May 12–18, 2026', avgTempF: 72.8, maxTempF: 78.5, minTempF: 65.2, avgHumidity: 61, condition: 'Sunny',         tempChangePct: -0.5, humidChangePct: -4.2 },
  { week: 'May 5–11, 2026',  avgTempF: 73.2, maxTempF: 79.0, minTempF: 66.8, avgHumidity: 64, condition: 'Rainy',         tempChangePct: -2.3, humidChangePct: 8.1 },
  { week: 'Apr 28–May 4, 2026', avgTempF: 75.0, maxTempF: 81.1, minTempF: 68.0, avgHumidity: 59, condition: 'Sunny',   tempChangePct: 3.5, humidChangePct: -5.0 },
  { week: 'Apr 21–27, 2026', avgTempF: 72.4, maxTempF: 78.3, minTempF: 65.6, avgHumidity: 62, condition: 'Partly Cloudy', tempChangePct: 0.9, humidChangePct: 2.8 },
];

export const monthlyHistory = [
  { month: 'Jun 2026 (partial)', avgTempF: 76.5, maxTempF: 84.1, minTempF: 68.4, avgHumidity: 63, tempChangePct: 3.2, humidChangePct: 1.5 },
  { month: 'May 2026',           avgTempF: 74.1, maxTempF: 83.2, minTempF: 65.2, avgHumidity: 61, tempChangePct: 1.8, humidChangePct: -2.3 },
  { month: 'Apr 2026',           avgTempF: 65.8, maxTempF: 74.5, minTempF: 56.2, avgHumidity: 65, tempChangePct: 5.9, humidChangePct: 3.1 },
  { month: 'Mar 2026',           avgTempF: 58.2, maxTempF: 66.8, minTempF: 49.0, avgHumidity: 67, tempChangePct: 8.4, humidChangePct: -1.2 },
  { month: 'Feb 2026',           avgTempF: 49.1, maxTempF: 58.3, minTempF: 38.7, avgHumidity: 70, tempChangePct: -2.1, humidChangePct: 4.4 },
  { month: 'Jan 2026',           avgTempF: 44.7, maxTempF: 53.2, minTempF: 35.4, avgHumidity: 72, tempChangePct: -6.3, humidChangePct: 6.8 },
];

// Correlative: same date window, 2025 vs 2026
export const correlativeData = dailyData2026.map((d26, i) => ({
  date: d26.date,
  temp2026: d26.air_temp,
  temp_current_year: d26.air_temp,
  rain2026: d26.rain,
  rain_current_year: d26.rain,
  temp2025: dailyData2025[i] ? dailyData2025[i].air_temp : null,
  temp_prev_year: dailyData2025[i] ? dailyData2025[i].air_temp : null,
  rain2025: dailyData2025[i] ? dailyData2025[i].rain : null,
  rain_prev_year: dailyData2025[i] ? dailyData2025[i].rain : null,
}));

// Sample chatbot conversation
export const sampleChatMessages = [
  { id: 1, role: 'assistant', text: 'Hello! I\'m your Carbon Footprint Assistant. Ask me how today\'s weather in Pleasantville relates to local carbon emissions or climate trends.', time: '11:00' },
  { id: 2, role: 'user', text: 'How does today\'s temperature compare to the 5-year average?', time: '11:02' },
  { id: 3, role: 'assistant', text: 'Today\'s temperature of 78.4°F is about 2.3°F above the 5-year average for June 15th in Pleasantville. This aligns with a regional warming trend of +1.8°F per decade observed since 2015.', time: '11:02' },
];
