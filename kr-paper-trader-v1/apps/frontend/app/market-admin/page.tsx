async function getStatus() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
  const [s, c] = await Promise.all([
    fetch(`${base}/api/market/status`, { cache: 'no-store' }),
    fetch(`${base}/api/market/calendar`, { cache: 'no-store' })
  ])
  return {
    status: s.ok ? await s.json() : null,
    calendar: c.ok ? await c.json() : []
  }
}

export default async function MarketAdminPage() {
  const data = await getStatus()
  return (
    <main>
      <h2>Market Admin</h2>
      <h3>Current Session</h3>
      <pre className="card">{JSON.stringify(data.status, null, 2)}</pre>
      <h3>Session Calendar</h3>
      <pre className="card">{JSON.stringify(data.calendar, null, 2)}</pre>
    </main>
  )
}
