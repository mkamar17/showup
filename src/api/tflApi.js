// TfL is called through Vite's development proxy so app credentials remain
// server-side during the hackathon demo. A production build should replace
// this path with a serverless route using the same contract.

export const TFL_LINES = [
  { id: "bakerloo", label: "Bakerloo line" },
  { id: "central", label: "Central line" },
  { id: "district", label: "District line" },
  { id: "elizabeth", label: "Elizabeth line" },
  { id: "jubilee", label: "Jubilee line" },
  { id: "northern", label: "Northern line" },
  { id: "piccadilly", label: "Piccadilly line" },
  { id: "victoria", label: "Victoria line" },
  { id: "waterloo-city", label: "Waterloo & City line" },
];

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
      line.name ||
      TFL_LINES.find((item) => item.id === lineId)?.label ||
      lineId,
    verified,
    label,
    reason,
    checkedAt: Date.now(),
  };
}
