export function calculateUrgency(
  severity?: string,
  probability?: number
) {
  if (severity === "severe" && probability && probability > 0.7) {
    return "critical";
  }

  if (severity === "severe") {
    return "high";
  }

  if (severity === "moderate") {
    return "medium";
  }

  return "low";
}
