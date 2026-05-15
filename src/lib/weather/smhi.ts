import type { Locale } from "@/lib/i18n";

export type StatusLevel = "green" | "yellow" | "red";

type SmhiTimeSeriesEntry = {
  time?: string;
  validTime?: string;
  data?: Record<string, number | null>;
  parameters?: Array<{
    name: string;
    values: number[];
  }>;
};

type SmhiPointResponse = {
  referenceTime?: string;
  timeSeries?: SmhiTimeSeriesEntry[];
  timeseries?: SmhiTimeSeriesEntry[];
};

export type WeatherSnapshot = {
  referenceTime: string;
  current: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    symbolCode: number;
  };
  forecast: Array<{
    time: string;
    temperature: number;
    windSpeed: number;
    windDirection: number;
    symbolCode: number;
  }>;
};

export type BoatAssessment = {
  status: StatusLevel;
  headline: string;
  detail: string;
};

const SMHI_LILLA_KARLSO = {
  lon: 17.9638,
  lat: 57.2842
};

const CACHE_KEY = "lillakarlso:smhi:v1";
const CACHE_TTL = 15 * 60 * 1000;

const statusBadgeText: Record<Locale, Record<StatusLevel, string>> = {
  sv: {
    green: "Normalt läge",
    yellow: "Förhöjd risk",
    red: "Hög risk"
  },
  en: {
    green: "Normal conditions",
    yellow: "Elevated risk",
    red: "High risk"
  }
};

const weatherLabels: Record<Locale, Record<number, string>> = {
  sv: {
    1: "Klart",
    2: "Nästan klart",
    3: "Växlande molnighet",
    4: "Halvklart",
    5: "Molnigt",
    6: "Mulet",
    7: "Dimma",
    8: "Lätta regnskurar",
    9: "Regnskurar",
    10: "Kraftiga regnskurar",
    11: "Åskskurar",
    12: "Lätta skurar av snöblandat regn",
    13: "Skurar av snöblandat regn",
    14: "Kraftiga skurar av snöblandat regn",
    15: "Lätta snöbyar",
    16: "Snöbyar",
    17: "Kraftiga snöbyar",
    18: "Lätt regn",
    19: "Regn",
    20: "Kraftigt regn",
    21: "Åska",
    22: "Lätt snöblandat regn",
    23: "Snöblandat regn",
    24: "Kraftigt snöblandat regn",
    25: "Lätt snöfall",
    26: "Snöfall",
    27: "Kraftigt snöfall"
  },
  en: {
    1: "Clear sky",
    2: "Nearly clear",
    3: "Variable cloud",
    4: "Half clear",
    5: "Cloudy",
    6: "Overcast",
    7: "Fog",
    8: "Light rain showers",
    9: "Rain showers",
    10: "Heavy rain showers",
    11: "Thunder showers",
    12: "Light sleet showers",
    13: "Sleet showers",
    14: "Heavy sleet showers",
    15: "Light snow showers",
    16: "Snow showers",
    17: "Heavy snow showers",
    18: "Light rain",
    19: "Rain",
    20: "Heavy rain",
    21: "Thunder",
    22: "Light sleet",
    23: "Sleet",
    24: "Heavy sleet",
    25: "Light snowfall",
    26: "Snowfall",
    27: "Heavy snowfall"
  }
};

export function getWeatherLabel(symbolCode: number, locale: Locale): string {
  return weatherLabels[locale][symbolCode] ?? (locale === "sv" ? "Osäker prognos" : "Uncertain forecast");
}

function getSmhiUrl(): string {
  const { lon, lat } = SMHI_LILLA_KARLSO;
  const parameters = ["air_temperature", "wind_speed", "wind_from_direction", "symbol_code"].join(",");
  return `https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/${lon}/lat/${lat}/data.json?timeseries=8&parameters=${parameters}`;
}

function readParameter(entry: SmhiTimeSeriesEntry, name: string): number | null {
  const modernValue = entry.data?.[name];

  if (typeof modernValue === "number" && modernValue !== 9999) {
    return modernValue;
  }

  const legacyNameMap: Record<string, string> = {
    air_temperature: "t",
    wind_speed: "ws",
    wind_from_direction: "wd",
    symbol_code: "Wsymb2"
  };

  const legacy = entry.parameters?.find((parameter) => parameter.name === legacyNameMap[name]);
  const legacyValue = legacy?.values?.[0];
  return typeof legacyValue === "number" && legacyValue !== 9999 ? legacyValue : null;
}

function normalizeEntry(entry: SmhiTimeSeriesEntry) {
  const temperature = readParameter(entry, "air_temperature");
  const windSpeed = readParameter(entry, "wind_speed");
  const windDirection = readParameter(entry, "wind_from_direction");
  const symbolCode = readParameter(entry, "symbol_code");
  const time = entry.time ?? entry.validTime;

  if (
    typeof time !== "string" ||
    temperature === null ||
    windSpeed === null ||
    windDirection === null ||
    symbolCode === null
  ) {
    return null;
  }

  return {
    time,
    temperature,
    windSpeed,
    windDirection,
    symbolCode
  };
}

function getCachedSnapshot(): WeatherSnapshot | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const cached = JSON.parse(raw) as { timestamp: number; snapshot: WeatherSnapshot };
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.snapshot;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function setCachedSnapshot(snapshot: WeatherSnapshot) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      timestamp: Date.now(),
      snapshot
    })
  );
}

async function requestJson<T>(url: string): Promise<T> {
  if (typeof fetch === "function") {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`SMHI request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }

  return await new Promise<T>((resolve, reject) => {
    if (typeof XMLHttpRequest === "undefined") {
      reject(new Error("No browser request API is available."));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`SMHI request failed with status ${xhr.status}`));
        return;
      }

      try {
        resolve(JSON.parse(xhr.responseText) as T);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("SMHI response could not be parsed."));
      }
    };
    xhr.onerror = () => reject(new Error("SMHI request failed before a response was received."));
    xhr.send();
  });
}

export async function fetchWeatherSnapshot(): Promise<WeatherSnapshot> {
  const cached = getCachedSnapshot();
  if (cached) {
    return cached;
  }

  const json = await requestJson<SmhiPointResponse>(getSmhiUrl());
  const series = (json.timeSeries ?? json.timeseries ?? []).map(normalizeEntry).filter(Boolean) as NonNullable<ReturnType<typeof normalizeEntry>>[];

  if (series.length === 0) {
    throw new Error("SMHI returned no usable forecast entries.");
  }

  const snapshot: WeatherSnapshot = {
    referenceTime: json.referenceTime ?? series[0].time,
    current: series[0],
    forecast: series
  };

  setCachedSnapshot(snapshot);
  return snapshot;
}

export function formatWindDirection(degrees: number, locale: Locale): string {
  const labels =
    locale === "sv"
      ? ["N", "NO", "O", "SO", "S", "SV", "V", "NV"]
      : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return labels[index];
}

function isWesterlySector(degrees: number): boolean {
  return degrees >= 202.5 && degrees <= 337.5;
}

function getRiskSectorLabel(degrees: number, locale: Locale): string {
  if (degrees >= 202.5 && degrees < 247.5) {
    return locale === "sv" ? "sydvästliga" : "southwesterly";
  }

  if (degrees >= 247.5 && degrees < 292.5) {
    return locale === "sv" ? "västliga" : "westerly";
  }

  return locale === "sv" ? "nordvästliga" : "northwesterly";
}

function severityFromWind(windSpeed: number, windDirection: number): StatusLevel {
  const baseScore = windSpeed >= 17 ? 2 : windSpeed >= 14 ? 1 : 0;
  const exposureBonus = isWesterlySector(windDirection) ? (windSpeed >= 12 ? 1 : windSpeed >= 9 ? 0.5 : 0) : 0;
  const score = baseScore + exposureBonus;

  if (score >= 2) {
    return "red";
  }

  if (score >= 1) {
    return "yellow";
  }

  return "green";
}

export function assessBoatConditions(snapshot: WeatherSnapshot, locale: Locale): BoatAssessment {
  const relevant = snapshot.forecast.slice(0, 6);
  const strongest = relevant.reduce((max, entry) => (entry.windSpeed > max.windSpeed ? entry : max), relevant[0]);
  const worst = relevant.reduce((status, entry) => {
    const next = severityFromWind(entry.windSpeed, entry.windDirection);
    if (status === "red" || next === status) {
      return status;
    }
    if (next === "red" || status === "green") {
      return next;
    }
    return "yellow";
  }, severityFromWind(relevant[0].windSpeed, relevant[0].windDirection));

  const westerly = isWesterlySector(strongest.windDirection);
  const sector = getRiskSectorLabel(strongest.windDirection, locale);
  const directionText = formatWindDirection(strongest.windDirection, locale);
  const maxWind = `${strongest.windSpeed.toFixed(1)} m/s`;

  if (worst === "red") {
    return {
      status: "red",
      headline: statusBadgeText[locale].red,
      detail:
        locale === "sv"
          ? `Avgångar bedöms sannolikt ställas in på grund av hård vind. Toppvind i närprognosen är omkring ${maxWind} från ${directionText}.`
          : `Departures are likely to be cancelled due to severe wind. Peak wind in the near forecast is around ${maxWind} from ${directionText}.`
    };
  }

  if (worst === "yellow" && westerly) {
    return {
      status: "yellow",
      headline: statusBadgeText[locale].yellow,
      detail:
        locale === "sv"
          ? `Starka ${sector} vindar kan ge svåra tilläggningsförhållanden. Toppvind i närprognosen är omkring ${maxWind}.`
          : `Strong ${sector} winds may cause difficult docking conditions. Peak wind in the near forecast is around ${maxWind}.`
    };
  }

  if (worst === "yellow") {
    return {
      status: "yellow",
      headline: statusBadgeText[locale].yellow,
      detail:
        locale === "sv"
          ? `Vindläget kräver extra bedömning inför avgång. Närprognosen visar upp mot ${maxWind}.`
          : `Wind conditions require additional assessment before departure. The near forecast reaches around ${maxWind}.`
    };
  }

  if (westerly && strongest.windSpeed >= 9) {
    return {
      status: "green",
      headline: statusBadgeText[locale].green,
      detail:
        locale === "sv"
          ? `${sector[0].toUpperCase()}${sector.slice(1)} vindar kan ändå göra tilläggningen mer utsatt trots att trafiken väntas gå normalt.`
          : `${sector[0].toUpperCase()}${sector.slice(1)} winds may still make docking more exposed even though traffic is expected to operate normally.`
    };
  }

  return {
    status: "green",
    headline: statusBadgeText[locale].green,
    detail:
      locale === "sv"
        ? "Båttrafiken väntas gå normalt enligt närprognosen."
        : "Boat traffic is expected to operate normally based on the near forecast."
  };
}
