export function getGroundAdvantageLabel(service?: string | null) {
  if (!service) return "Ground Advantage";
  return service.replace(/^USPS\s+/i, "").replace(/\s*\(.*\)\s*$/, "") || "Ground Advantage";
}
