// TfL is called through Vite's development proxy so app credentials remain
// server-side during the hackathon demo. A production build should replace
// this path with a serverless route using the same contract.

export const TFL_LINES = [
  { id: "bakerloo", label: "Bakerloo line" },
  { id: "central", label: "Central line" },
  { id: "circle", label: "Circle line" },
  { id: "district", label: "District line" },
  { id: "dlr", label: "DLR" },
  { id: "elizabeth", label: "Elizabeth line" },
  { id: "hammersmith-city", label: "Hammersmith & City line" },
  { id: "jubilee", label: "Jubilee line" },
  { id: "liberty", label: "Liberty line (Overground)" },
  { id: "lioness", label: "Lioness line (Overground)" },
  { id: "metropolitan", label: "Metropolitan line" },
  { id: "mildmay", label: "Mildmay line (Overground)" },
  { id: "northern", label: "Northern line" },
  { id: "piccadilly", label: "Piccadilly line" },
  { id: "suffragette", label: "Suffragette line (Overground)" },
  { id: "victoria", label: "Victoria line" },
  { id: "waterloo-city", label: "Waterloo & City line" },
  { id: "weaver", label: "Weaver line (Overground)" },
  { id: "windrush", label: "Windrush line (Overground)" },
];

// What a TfL status means for your commitment. Only disruption you couldn't
// plan around counts: closures are announced in advance, so they don't.
//   release: your commitment comes back and you're not a no-show
//   extend:  your own check-in deadline moves back by `minutes`
//   none:    normal rules apply
export function protectionFor(label) {
  if (/suspended/i.test(label)) return { outcome: "release" };
  if (/severe delays/i.test(label)) return { outcome: "extend", minutes: 20 };
  if (/minor delays|reduced service/i.test(label))
    return { outcome: "extend", minutes: 10 };
  if (/closure|closed/i.test(label))
    return {
      outcome: "none",
      why: "Closures are announced in advance, so they don’t count as an excuse.",
    };
  return { outcome: "none" };
}

// Statuses the demo can pretend TfL returned (live TfL is usually calm).
export const DEMO_TFL_STATUSES = ["Suspended", "Severe Delays", "Minor Delays", "Good Service"];

export function demoTfLStatus(lineId, label) {
  return {
    lineId,
    lineName: TFL_LINES.find((item) => item.id === lineId)?.label || lineId,
    verified: label !== "Good Service",
    label,
    reason: label === "Good Service" ? "No disruption details available." : "Demo: simulated disruption for the presentation.",
    checkedAt: Date.now(),
    demo: true,
  };
}

export async function getTfLLineStatus(lineId) {
  const response = await fetch(
    `/api/tfl/Line/${encodeURIComponent(lineId)}/Status?detail=true`,
  );
  if (!response.ok)
    throw new Error("TfL service status is unavailable right now.");

  const [line] = await response.json();
  const status = line?.lineStatuses?.[0];
  if (!line || !status)
    throw new Error("TfL did not return a status for that line.");

  const label = status.statusSeverityDescription || "Unknown service status";
  const reason =
    status.reason ||
    line.disruptions?.[0]?.description ||
    line.disruptions?.[0]?.summary ||
    "No disruption details available.";
  const verified = !/^good service$/i.test(label);

  return {
    lineId,
    lineName:
      TFL_LINES.find((item) => item.id === lineId)?.label ||
      line.name ||
      lineId,
    verified,
    label,
    reason,
    checkedAt: Date.now(),
  };
}
