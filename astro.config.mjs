import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://www.lillakarlso.se",
  output: "static",
  trailingSlash: "always",
  compressHTML: true,
  i18n: {
    locales: ["sv", "en"],
    defaultLocale: "sv",
    routing: {
      prefixDefaultLocale: true
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "sv",
        locales: {
          sv: "sv-SE",
          en: "en-GB"
        }
      }
    })
  ]
});
