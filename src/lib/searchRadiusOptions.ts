export const RADIUS_OPTIONS = [
  { label: "指定しない（エリア全体を検索）", value: 0 },
  { label: "500m", value: 500 },
  { label: "1km", value: 1000 },
  { label: "2km", value: 2000 },
  { label: "3km", value: 3000 },
];

export function formatSearchRadius(meters: number | null | undefined): string {
  if (meters == null) return "";
  const option = RADIUS_OPTIONS.find((o) => o.value === meters);
  if (option) return option.value === 0 ? "指定しない" : option.label;
  return `${meters}m`;
}
