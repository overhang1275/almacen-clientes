export function unitLabel(unit: string | null | undefined) {
  if (unit === "MT") return "m.l.";
  if (unit === "PCS") return "pza.";
  return unit ?? "";
}
