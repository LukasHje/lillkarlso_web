import { defineCollection, z } from "astro:content";

const passthrough = z.object({}).passthrough();

export const collections = {
  sv: defineCollection({
    type: "data",
    schema: passthrough
  }),
  en: defineCollection({
    type: "data",
    schema: passthrough
  })
};
