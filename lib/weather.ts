/*
 * Run-day weather via Open-Meteo (free, keyless). Boston coordinates —
 * Castle Island. Forecasts reach ~16 days out; beyond that we return null.
 */

import { bostonToUtc } from '@/lib/ics';

const LAT = 42.335;
const LON = -71.01;

export interface RunWeather {
  tempF: number;
  precipChance: number; // 0-100
  summary: string;
  emoji: string;
  hotPaws: boolean; // ≥80°F — pavement check + extra water
}

const WMO: Record<number, { summary: string; emoji: string }> = {
  0: { summary: 'Clear', emoji: '☀️' },
  1: { summary: 'Mostly clear', emoji: '🌤️' },
  2: { summary: 'Partly cloudy', emoji: '⛅' },
  3: { summary: 'Overcast', emoji: '☁️' },
  45: { summary: 'Fog', emoji: '🌫️' },
  48: { summary: 'Fog', emoji: '🌫️' },
  51: { summary: 'Drizzle', emoji: '🌦️' },
  53: { summary: 'Drizzle', emoji: '🌦️' },
  55: { summary: 'Drizzle', emoji: '🌦️' },
  61: { summary: 'Light rain', emoji: '🌧️' },
  63: { summary: 'Rain', emoji: '🌧️' },
  65: { summary: 'Heavy rain', emoji: '🌧️' },
  71: { summary: 'Snow', emoji: '🌨️' },
  73: { summary: 'Snow', emoji: '🌨️' },
  75: { summary: 'Heavy snow', emoji: '❄️' },
  80: { summary: 'Showers', emoji: '🌦️' },
  81: { summary: 'Showers', emoji: '🌧️' },
  82: { summary: 'Heavy showers', emoji: '⛈️' },
  95: { summary: 'Thunderstorms', emoji: '⛈️' },
  96: { summary: 'Thunderstorms', emoji: '⛈️' },
  99: { summary: 'Thunderstorms', emoji: '⛈️' },
};

/* Forecast for a Boston-local run date + time. Null if unavailable/too far out. */
export async function getRunWeather(date: string, time: string): Promise<RunWeather | null> {
  try {
    const target = bostonToUtc(date, time);
    const daysOut = (target.getTime() - Date.now()) / 86_400_000;
    if (daysOut < -1 || daysOut > 15) return null;

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&hourly=temperature_2m,precipitation_probability,weather_code` +
      `&temperature_unit=fahrenheit&timezone=America%2FNew_York` +
      `&start_date=${date}&end_date=${date}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();

    const hours: string[] = data?.hourly?.time ?? [];
    const idx = hours.findIndex((t) => t.startsWith(`${date}T${time.slice(0, 2)}`));
    if (idx < 0) return null;

    const tempF = Math.round(data.hourly.temperature_2m[idx]);
    const precipChance = Math.round(data.hourly.precipitation_probability?.[idx] ?? 0);
    const code = data.hourly.weather_code?.[idx] ?? 0;
    const { summary, emoji } = WMO[code] ?? { summary: 'Mixed', emoji: '🌡️' };

    return { tempF, precipChance, summary, emoji, hotPaws: tempF >= 80 };
  } catch {
    return null;
  }
}
