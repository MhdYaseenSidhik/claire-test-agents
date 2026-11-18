import { useState, useEffect } from 'react'

// Resolve a path relative to the app's base URL so data files work on GitHub Pages
// e.g. '/data/dims.json' → '/claire-test-agents/data/dims.json' when base='/claire-test-agents/'
function resolveUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  // path always starts with '/', base ends with '/'
  return base.replace(/\/$/, '') + path
}

export function useData<T>(path: string, enabled = true) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const url = resolveUrl(path)
    setLoading(true); setError(null)
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [path, enabled])

  return { data, loading, error }
}
