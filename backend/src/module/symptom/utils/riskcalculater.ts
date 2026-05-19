export function calculateUrgency(
  severity?: string,
  probability?: number
) {
  if (severity === "high" && probability && probability > 0.7) {
    return "HIGH";
  }

  if (severity === "medium") {
    return "MEDIUM";
  }

  return "LOW";
}