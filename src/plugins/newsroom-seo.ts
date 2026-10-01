import { definePlugin } from "emdash";
import { buildBlogPostingJsonLd } from "emdash/page";

// Native site hook: the existing Worker has no isolated plugin loader.
// Reuse EmDash's SEO graph and replace its primary graph by the same ID.
export function createPlugin() { return definePlugin({
	id: "plovdivtoday-seo",
	version: "1.0.0",
	hooks: {
		"page:metadata": ({ page }) => {
			if (page.content?.collection !== "articles") return null;
			const graph = buildBlogPostingJsonLd(page);
			if (!graph) return null;
			graph["@type"] = "NewsArticle";
			if (page.articleMeta?.author === "Редакция PlovdivToday") {
				graph.author = { "@type": "Organization", name: page.articleMeta.author };
			}
			return [
				{ kind: "jsonld", id: "primary", graph },
				...(page.breadcrumbs?.length ? [{
					kind: "jsonld" as const, id: "breadcrumbs",
					graph: { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: page.breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })) },
				}] : []),
			];
		},
	},
}); }
