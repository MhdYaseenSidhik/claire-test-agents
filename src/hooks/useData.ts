import { useState, useEffect } from 'react'
export function useData<T>(url: string, enabled = true) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) return
    setLoading(true); setError(null)
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [url, enabled])
  return { data, loading, error }
}
