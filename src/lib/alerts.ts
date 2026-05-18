import type { Locale } from "@/lib/i18n";

export type AlertLevel = "closure" | "caution" | "information";

export type SiteAlert = {
  level: AlertLevel;
  title: string;
  body: string;
  posted: string;
  locations: string[];
};

const levelWeight: Record<AlertLevel, number> = {
  closure: 3,
  caution: 2,
  information: 1
};

const levelMeta = {
  closure: {
    status: "red",
    label: {
      sv: "Avstängning",
      en: "Park Closure"
    }
  },
  caution: {
    status: "yellow",
    label: {
      sv: "Varning",
      en: "Caution"
    }
  },
  information: {
    status: "green",
    label: {
      sv: "Information",
      en: "Information"
    }
  }
} as const;

export function sortAlerts(alerts: SiteAlert[]) {
  return [...alerts].sort((left, right) => {
    const priority = levelWeight[right.level] - levelWeight[left.level];

    if (priority !== 0) {
      return priority;
    }

    return right.posted.localeCompare(left.posted);
  });
}

export function getAlertSummary(alerts: SiteAlert[]) {
  const sorted = sortAlerts(alerts);
  const primary = sorted[0];
  const remaining = sorted.slice(1);

  return {
    count: sorted.length,
    sorted,
    primary,
    remaining,
    counts: {
      closure: sorted.filter((item) => item.level === "closure").length,
      caution: sorted.filter((item) => item.level === "caution").length,
      information: sorted.filter((item) => item.level === "information").length
    }
  };
}

export function groupAlertsByLevel(alerts: SiteAlert[]) {
  const grouped = {
    closure: [] as SiteAlert[],
    caution: [] as SiteAlert[],
    information: [] as SiteAlert[]
  };

  sortAlerts(alerts).forEach((alert) => {
    grouped[alert.level].push(alert);
  });

  return grouped;
}

export function getUniqueAlertLocations(alerts: SiteAlert[]) {
  return [...new Set(sortAlerts(alerts).flatMap((alert) => alert.locations))];
}

export function getAlertLevelMeta(level: AlertLevel, locale: Locale) {
  return {
    status: levelMeta[level].status,
    label: levelMeta[level].label[locale]
  };
}

export function formatAlertDate(value: string, locale: Locale) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(locale === "sv" ? "sv-SE" : "en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).format(date);
}

export function remainingAlertsAreLowerSeverity(primary: SiteAlert | undefined, alerts: SiteAlert[]) {
  if (!primary || primary.level !== "closure" || alerts.length === 0) {
    return false;
  }

  return alerts.every((alert) => levelWeight[alert.level] < levelWeight[primary.level]);
}
