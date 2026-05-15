import en from "@/locales/en.json";
import sv from "@/locales/sv.json";

export const LOCALES = ["sv", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export type Messages = typeof sv;

const messages: Record<Locale, Messages> = {
  sv,
  en
};

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export function t(locale: Locale): Messages {
  return getMessages(locale);
}
