/**
 * `<input type="datetime-local">` speaks `YYYY-MM-DDTHH:mm` in the user's
 * local timezone with no offset. Helpers below bridge between that string
 * format and ISO timestamps used by the backend.
 */

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Local Date → "YYYY-MM-DDTHH:mm" suitable for datetime-local input. */
export function toLocalInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Backend ISO → datetime-local input value (drops seconds + timezone). */
export function isoToLocalInputValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return toLocalInputValue(d)
}

/** datetime-local string → ISO 8601 the API expects. */
export function localInputToIso(value: string): string {
  if (!value) return ''
  return new Date(value).toISOString()
}
