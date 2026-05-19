import { load } from "js-yaml";
import { z } from "zod";

import type { Locale } from "@/lib/i18n";

const yamlModules = import.meta.glob("../content/*/*.yaml", {
  query: "?raw",
  import: "default",
  eager: true
}) as Record<string, string>;

const factSchema = z.object({
  label: z.string(),
  value: z.string()
});

const linkSchema = z.object({
  label: z.string(),
  href: z.string()
});

const sectionSchema = z.object({
  kicker: z.string().optional(),
  title: z.string(),
  intro: z.string(),
  body: z.array(z.string()),
  links: z.array(linkSchema).optional()
});

const highlightSchema = z.object({
  title: z.string(),
  text: z.string()
});

const timelineSchema = z.object({
  year: z.string(),
  title: z.string(),
  text: z.string()
});

const mapPointSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string()
});

const contactDetailSchema = z.object({
  label: z.string(),
  value: z.string(),
  href: z.string().optional()
});

const islandSchema = z.object({
  hero: z.object({
    kicker: z.string(),
    title: z.string(),
    intro: z.string(),
    image: z.string(),
    cta: linkSchema,
    secondaryCta: linkSchema
  }),
  overview: sectionSchema,
  geology: sectionSchema,
  facts: z.array(factSchema),
  highlights: z.array(highlightSchema),
  history: z.object({
    section: sectionSchema,
    timeline: z.array(timelineSchema)
  }),
  about: z.object({
    section: sectionSchema,
    stewardship: z.array(highlightSchema)
  }),
  grazing: z.object({
    section: sectionSchema,
    highlights: z.array(highlightSchema)
  }),
  map: z.object({
    title: z.string(),
    intro: z.string(),
    points: z.array(mapPointSchema)
  }),
  contact: z.object({
    title: z.string(),
    intro: z.string(),
    details: z.array(contactDetailSchema)
  })
});

const travelInfoSchema = z.object({
  hero: z.object({
    kicker: z.string(),
    title: z.string(),
    intro: z.string(),
    image: z.string()
  }),
  visit: z.object({
    overview: sectionSchema,
    practicalCards: z.array(highlightSchema),
    steps: z.array(highlightSchema)
  }),
  operations: z.object({
    bookingWindow: z.string(),
    seasonWindow: z.string(),
    departure: z.string(),
    returnTrip: z.string(),
    weatherNotice: z.string(),
    pricingTitle: z.string(),
    pricing: z.array(z.string()),
    bookingTitle: z.string(),
    bookingDetails: z.array(contactDetailSchema),
    bookingNotes: z.array(z.string()),
    privateBoat: z.object({
      title: z.string(),
      intro: z.string(),
      body: z.array(z.string()),
      contactLabel: z.string(),
      contactValue: z.string(),
      contactHref: z.string().optional()
    })
  }),
  safety: z.object({
    overview: sectionSchema,
    rules: z.array(highlightSchema),
    emergency: z.array(highlightSchema)
  }),
  accessibility: z.object({
    title: z.string(),
    intro: z.string(),
    items: z.array(highlightSchema)
  })
});

const toursSchema = z.object({
  hero: z.object({
    kicker: z.string(),
    title: z.string(),
    intro: z.string(),
    image: z.string()
  }),
  intro: sectionSchema,
  tours: z.array(
    z.object({
      title: z.string(),
      duration: z.string(),
      season: z.string(),
      difficulty: z.string(),
      summary: z.string(),
      highlights: z.array(z.string())
    })
  ),
  booking: z.object({
    title: z.string(),
    intro: z.string(),
    notes: z.array(z.string())
  })
});

const seasonsSchema = z.object({
  hero: z.object({
    kicker: z.string(),
    title: z.string(),
    intro: z.string(),
    image: z.string()
  }),
  overview: sectionSchema,
  seasons: z.array(
    z.object({
      title: z.string(),
      months: z.string(),
      status: z.enum(["green", "yellow", "red"]),
      summary: z.string(),
      highlights: z.array(z.string())
    })
  ),
  planning: z.object({
    title: z.string(),
    intro: z.string(),
    notes: z.array(z.string())
  })
});

const wildlifeSchema = z.object({
  hero: z.object({
    kicker: z.string(),
    title: z.string(),
    intro: z.string(),
    image: z.string()
  }),
  ecology: sectionSchema,
  habitats: z.array(highlightSchema),
  species: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      summary: z.string()
    })
  ),
  conservation: z.object({
    title: z.string(),
    intro: z.string(),
    efforts: z.array(highlightSchema)
  })
});

const alertsSchema = z.object({
  items: z.array(
    z.object({
      level: z.enum(["closure", "caution", "information"]),
      title: z.string(),
      body: z.string(),
      posted: z.string(),
      locations: z.array(z.string())
    })
  )
});

type ContentKey = "island" | "travel-info" | "tours" | "seasons" | "wildlife" | "alerts";

function loadYamlDocument<T>(locale: Locale, key: ContentKey, schema: z.ZodType<T>): T {
  const path = `../content/${locale}/${key}.yaml`;
  const source = yamlModules[path];

  if (!source) {
    throw new Error(`Missing content file: ${path}`);
  }

  const parsed = load(source);
  return schema.parse(parsed);
}

export function getSiteContent(locale: Locale) {
  return {
    island: loadYamlDocument(locale, "island", islandSchema),
    travelInfo: loadYamlDocument(locale, "travel-info", travelInfoSchema),
    tours: loadYamlDocument(locale, "tours", toursSchema),
    seasons: loadYamlDocument(locale, "seasons", seasonsSchema),
    wildlife: loadYamlDocument(locale, "wildlife", wildlifeSchema),
    alerts: loadYamlDocument(locale, "alerts", alertsSchema)
  };
}

export type SiteContent = ReturnType<typeof getSiteContent>;
