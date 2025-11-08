/**
 * Open-Meteo Weather Agent
 * Retrieves weather forecasts using coordinates
 */

interface WeatherData {
  latitude: number;
  longitude: number;
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

export class OpenMeteoAgent {
  private readonly baseUrl = 'https://api.open-meteo.com/v1';

  /**
   * Get current weather for coordinates
   */
  async getWeather(latitude: number, longitude: number, includeForecast = false): Promise<WeatherData> {
    let url = `${this.baseUrl}/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

    if (includeForecast) {
      url += '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto';
    }

    console.log(`☁️ OpenMeteo weather: lat=${latitude}, lon=${longitude}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.statusText}`);
    }

    const data = await response.json() as WeatherData;
    console.log(`✅ Weather data retrieved`);

    return data;
  }

  /**
   * Format weather data for Gemini
   */
  formatWeather(data: WeatherData): string {
    const { current_weather, latitude, longitude, daily } = data;
    const weatherCodes: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      80: 'Slight rain showers',
      95: 'Thunderstorm',
    };

    const condition = weatherCodes[current_weather.weathercode] || 'Unknown';

    let result = `📍 Location: lat: ${latitude}, lon: ${longitude}\n`;
    result += `🌡️ Current temperature: ${current_weather.temperature}°C\n`;
    result += `💨 Wind speed: ${current_weather.windspeed} km/h\n`;
    result += `☁️ Conditions: ${condition}\n`;
    result += `🕐 Time: ${current_weather.time}`;

    if (daily && daily.time) {
      result += `\n\n📅 Forecast (next 3 days):\n`;
      for (let i = 0; i < Math.min(3, daily.time.length); i++) {
        result += `${daily.time[i]}: ${daily.temperature_2m_min[i]}°C - ${daily.temperature_2m_max[i]}°C, `;
        result += `precipitation: ${daily.precipitation_sum[i]}mm\n`;
      }
    }

    return result;
  }
}
