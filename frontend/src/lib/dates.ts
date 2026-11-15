const pad = (n: number): string => String(n).padStart(2, "0");

// The API sends UTC. If a timestamp arrives without a timezone suffix, treat it as UTC
// instead of letting the browser guess local time.
function parse(iso: string): Date {
  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso);
  return new Date(hasTimezone ? iso : `${iso}Z`);
}

// ISO string from the API -> value for <input type="datetime-local"> (in the user's local time)
export function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = parse(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// <input type="datetime-local"> value -> ISO string (UTC) for the API; empty means "no date"
export function fromLocalInput(value?: string | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  return parse(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
