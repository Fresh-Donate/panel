// `<input type="datetime-local">` speaks `YYYY-MM-DDTHH:mm` in the user's
// local timezone with no offset. Helpers below bridge that to ISO timestamps.

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function toLocalInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function isoToLocalInputValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return toLocalInputValue(d)
}

export function localInputToIso(value: string): string {
  if (!value) return ''
  return new Date(value).toISOString()
}
