import { execSync } from 'child_process'

const TIMEOUT = 30000
const SESSION = 'elrata'
const CMD = `npx agent-browser --session ${SESSION}`

function run(cmd: string): string {
  try {
    return execSync(cmd, {
      timeout: TIMEOUT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch (error) {
    const err = error as { stdout?: string }
    return err.stdout || ''
  }
}

export function closeBrowser(): void {
  try { run(`${CMD} close`) } catch { /* ignore */ }
}

/**
 * Scrapes a page fast:
 * 1. Open + wait for load
 * 2. One scroll to trigger lazy content
 * 3. Get snapshot (structured data with links and prices)
 */
export async function scrapePageFull(url: string): Promise<string> {
  run(`${CMD} open "${url}"`)
  run(`${CMD} wait --load networkidle`)
  run(`${CMD} wait 1500`)
  run(`${CMD} scroll down 1200`)
  run(`${CMD} wait 1500`)

  // Snapshot captures the accessibility tree — product names, prices, links
  const snapshot = run(`${CMD} snapshot -i`)
  return snapshot
}
