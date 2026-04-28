// Lexicographic ordering for Kanban cards/columns
// Keys compare correctly with standard string comparison

export function getLexoKey(prev: string | null, next: string | null): string {
  const p = prev ?? ''
  const n = next ?? ''

  if (!p && !n) return 'n'

  // Only next - return something before it
  if (!p) {
    const code = n.charCodeAt(0)
    if (code > 97) return String.fromCharCode(Math.floor((96 + code) / 2))
    return 'a' + getLexoKey(null, n.slice(1) || null)
  }

  // Only prev - return something after it
  if (!n) {
    const code = p.charCodeAt(p.length - 1)
    if (code < 122) return p.slice(0, -1) + String.fromCharCode(Math.floor((code + 123) / 2))
    return p + 'n'
  }

  // Both present - find midpoint character by character
  const maxLen = Math.max(p.length, n.length)
  for (let i = 0; i <= maxLen; i++) {
    const pc = i < p.length ? p.charCodeAt(i) : 96
    const nc = i < n.length ? n.charCodeAt(i) : 123
    const diff = nc - pc
    if (diff >= 2) {
      const mid = Math.min(122, Math.max(97, pc + Math.floor(diff / 2)))
      return p.slice(0, i) + String.fromCharCode(mid)
    }
    if (diff === 0) continue
  }
  return p + 'n'
}

export function getInitialKey(): string { return 'n' }
export function getKeyAfter(key: string): string { return getLexoKey(key, null) }
export function getKeyBefore(key: string): string { return getLexoKey(null, key) }
