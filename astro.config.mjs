import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";
import { fileURLToPath } from "node:url";

export default defineConfig({
	output: "server",
	site: "https://plovdivtodaysite.estudio-5ba.workers.dev",
	i18n: { defaultLocale: "bg", locales: ["bg"] },
	adapter: cloudflare(),
	image: {
		domains: ["plovdivtodaysite.estudio-5ba.workers.dev"],
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			plugins: [{ id: "plovdivtoday-seo", version: "1.0.0", format: "native", entrypoint: fileURLToPath(new URL("./src/plugins/newsroom-seo.ts", import.meta.url)) }],
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-body",
			weights: [400, 500, 600, 700],
			subsets: ["latin", "cyrillic", "cyrillic-ext"],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
	],
	devToolbar: { enabled: false },
});
