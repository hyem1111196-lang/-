const pad = (n: number) => String(n).padStart(2, "0");

export function formatObservedAt(d: Date): string {
  return `${pad(d.getMonth() + 1)}\uC6D4 ${pad(d.getDate())}\uC77C ${pad(d.getHours())}:${pad(d.getMinutes())} \uC870\uD68C`;
}

export function formatTimestamp(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTemp(c: number): string {
  return `${c.toFixed(1)}\u00B0C`;
}

export function formatHourLabel(d: Date): string {
  return `${d.getHours()}\uC2DC`;
}