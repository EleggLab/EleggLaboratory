async function getStatus() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
  const res = await fetch(`${base}/api/market/status`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function MarketAdminPage() {
  const status = await getStatus()
  return (
    <main>
      <h2>Market Admin</h2>
      <pre className="card">{JSON.stringify(status, null, 2)}</pre>
    </main>
  )
}
