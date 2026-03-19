async function getRisk() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
  const res = await fetch(`${base}/api/settings/risk`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function RiskPage() {
  const risk = await getRisk()
  return (
    <main>
      <h2>Risk Settings</h2>
      <pre className="card">{JSON.stringify(risk, null, 2)}</pre>
    </main>
  )
}
