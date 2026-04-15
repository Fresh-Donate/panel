import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let buildInfo = { version: '1.0.0', commit: 'unknown' }
try {
  const raw = readFileSync(resolve(process.cwd(), 'build-info.json'), 'utf-8')
  buildInfo = JSON.parse(raw)
} catch {
  // file not found — fallback
}

export default defineEventHandler(() => {
  return {
    name: 'FreshDonate Panel',
    ...buildInfo
  }
})
