import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type PageKey =
  | "home"
  | "visit"
  | "weather"
  | "tours"
  | "nature"
  | "history"
  | "safety"
  | "seasons"
  | "about"
  | "contact";

type RouteDefinition = {
  key: PageKey;
  segment: Record<Locale, string>;
};

export type NavigationItem = {
  label: string;
  href: string;
  description: string;
  external?: boolean;
};

export type NavigationGroup = {
  title: string;
  href: string;
  items: NavigationItem[];
  external?: boolean;
};

export type QuickAction = {
  label: string;
  href: string;
  icon: "info" | "alerts" | "map" | "tours" | "contact";
  activeKeys: PageKey[];
  external?: boolean;
};

export const routeDefinitions: RouteDefinition[] = [
  { key: "home", segment: { sv: "", en: "" } },
  { key: "visit", segment: { sv: "besok", en: "visit" } },
  { key: "weather", segment: { sv: "vader", en: "weather" } },
  { key: "tours", segment: { sv: "turer", en: "tours" } },
  { key: "nature", segment: { sv: "natur", en: "nature" } },
  { key: "history", segment: { sv: "historia", en: "history" } },
  { key: "safety", segment: { sv: "sakerhet", en: "safety" } },
  { key: "seasons", segment: { sv: "sasonger", en: "seasons" } },
  { key: "about", segment: { sv: "om", en: "about" } },
  { key: "contact", segment: { sv: "kontakt", en: "contact" } }
];

export const siteMeta = {
  name: "Lilla Karlsö Nature Reserve",
  description:
    "A bilingual static visitor website for Lilla Karlsö, focused on travel planning, island conditions, wildlife, and conservation.",
  image: "/images/lilla-karlso-topdown.jpg"
};

const GOTLAND_MEMBERSHIP_URL = "https://naturskyddsforeningengotland.se/medlemskap";

export function getRouteSegment(locale: Locale, key: PageKey): string {
  return routeDefinitions.find((route) => route.key === key)?.segment[locale] ?? "";
}

export function getLocaleUrl(locale: Locale, key: PageKey): string {
  const segment = getRouteSegment(locale, key);
  return segment ? `/${locale}/${segment}/` : `/${locale}/`;
}

export function resolvePageKey(locale: Locale, segment: string | undefined): PageKey | undefined {
  if (!segment) {
    return "home";
  }

  return routeDefinitions.find((route) => route.segment[locale] === segment)?.key;
}

export function getAlternateLanguageLinks(key: PageKey) {
  return [
    { locale: "sv" as const, href: getLocaleUrl("sv", key) },
    { locale: "en" as const, href: getLocaleUrl("en", key) }
  ];
}

export function getNavigationGroups(locale: Locale): NavigationGroup[] {
  const messages = t(locale);

  return [
    {
      title: messages.navigation.visit,
      href: getLocaleUrl(locale, "visit"),
      items: [
        {
          label: locale === "sv" ? "Föreskrifter och besöksråd" : "Rules and visitor guidance",
          href: getLocaleUrl(locale, "visit"),
          description: locale === "sv" ? "Praktisk planering, reservatsföreskrifter och hur dagen vanligtvis fungerar." : "Practical planning, reserve rules, and how a visit typically works."
        },
        {
          label: locale === "sv" ? "Tillgänglighet" : "Accessibility",
          href: `${getLocaleUrl(locale, "visit")}#accessibility`,
          description: locale === "sv" ? "Vad som fungerar, vad som är svårt, och hur terrängen påverkar besöket." : "What works well, what is difficult, and how terrain affects access."
        },
        {
          label: locale === "sv" ? "Egen båt och kajak" : "Own boat and kayak",
          href: `${getLocaleUrl(locale, "visit")}#boat-kayak`,
          description: locale === "sv" ? "Råd om egen angöring och varför västliga vindar snabbt kan ändra läget." : "Guidance on private landing and why westerly winds can quickly change conditions."
        },
        {
          label: messages.routes.safety,
          href: getLocaleUrl(locale, "safety"),
          description: locale === "sv" ? "Säkerhet vid klintkant, hårt väder och känsliga fågelmiljöer." : "Safety near cliff edges, in hard weather, and around sensitive bird habitats."
        }
      ]
    },
    {
      title: messages.navigation.nature,
      href: getLocaleUrl(locale, "nature"),
      items: [
        {
          label: locale === "sv" ? "Natur och djurliv" : "Nature and wildlife",
          href: getLocaleUrl(locale, "nature"),
          description: locale === "sv" ? "Fågelliv, orkidéer, kalkhedar och kustekologi." : "Seabirds, orchids, limestone habitats, and coastal ecology."
        },
        {
          label: messages.routes.history,
          href: getLocaleUrl(locale, "history"),
          description: locale === "sv" ? "Beteslandskap, naturvård, forskning och berättelser från ön." : "Grazing landscapes, conservation, research, and island history."
        },
        {
          label: messages.routes.about,
          href: getLocaleUrl(locale, "about"),
          description: locale === "sv" ? "Om reservatet, förvaltningen och platsens långsiktiga skydd." : "About the reserve, its stewardship, and long-term protection."
        }
      ]
    },
    {
      title: messages.navigation.involved,
      href: GOTLAND_MEMBERSHIP_URL,
      external: true,
      items: [
        {
          label: locale === "sv" ? "Bli medlem" : "Become a member",
          href: GOTLAND_MEMBERSHIP_URL,
          external: true,
          description: locale === "sv" ? "Stöd Gotlands Naturskyddsförening och det lokala naturvårdsarbetet." : "Support the local conservation work through membership in the Gotland Nature Conservation Society."
        },
        {
          label: locale === "sv" ? "Naturvårdsarbetet" : "Conservation work",
          href: getLocaleUrl(locale, "about"),
          description: locale === "sv" ? "Läs mer om hur reservatet vårdas och hur besök och skydd balanseras." : "Learn how stewardship, visitor access, and protection are balanced."
        }
      ]
    }
  ];
}

export function getQuickActionLinks(locale: Locale): QuickAction[] {
  const messages = t(locale);

  return [
    {
      label: messages.navigation.info,
      href: getLocaleUrl(locale, "about"),
      icon: "info",
      activeKeys: ["about", "history"]
    },
    {
      label: messages.navigation.alerts,
      href: getLocaleUrl(locale, "weather"),
      icon: "alerts",
      activeKeys: ["weather", "seasons"]
    },
    {
      label: messages.navigation.map,
      href: `${getLocaleUrl(locale, "visit")}#visit-map`,
      icon: "map",
      activeKeys: ["visit"]
    },
    {
      label: messages.routes.tours,
      href: getLocaleUrl(locale, "tours"),
      icon: "tours",
      activeKeys: ["tours"]
    },
    {
      label: messages.routes.contact,
      href: getLocaleUrl(locale, "contact"),
      icon: "contact",
      activeKeys: ["contact"]
    }
  ];
}
