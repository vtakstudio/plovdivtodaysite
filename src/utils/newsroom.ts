import { getEmDashCollection } from "emdash";

export const sections = [
	["plovdiv", "Пловдив"], ["trafik", "Трафик"],
	["oblast-plovdiv", "Област Пловдив"], ["biznes", "Бизнес"],
	["kultura", "Култура"], ["sport", "Спорт"],
	["bulgaria", "България"], ["uikend", "Уикенд"],
	["kriminalni", "Криминални"],
] as const;

export type Article = Awaited<ReturnType<typeof getEmDashCollection<"articles">>>["entries"][number];

export function formatDate(date: Date | null | undefined, timeOnly = false) {
	if (!date || Number.isNaN(date.getTime())) return "";
	return new Intl.DateTimeFormat("bg-BG", {
		timeZone: "Europe/Sofia",
		...(timeOnly ? {} : { day: "numeric", month: "long", year: "numeric" } as const),
		hour: "2-digit", minute: "2-digit",
	}).format(date);
}

export function imageUrl(image: unknown, origin: string): string | undefined {
	if (!image || typeof image !== "object") return undefined;
	const value = image as { src?: string; meta?: { storageKey?: string } };
	const path = value.src || (value.meta?.storageKey ? `/_emdash/api/media/file/${value.meta.storageKey}` : undefined);
	return path ? new URL(path, origin).href : undefined;
}
