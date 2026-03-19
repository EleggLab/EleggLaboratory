async function getDashboard() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
  const res = await fetch(`${base}/api/dashboard`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function DashboardPage() {
  const data = await getDashboard()
  return (
    <main>
      <h2>Dashboard</h2>
      <div className="grid">
        <div className="card">총자산<br /><b>{data?.total_asset ?? '-'} </b></div>
        <div className="card">현금비중<br /><b>{data?.cash_weight_pct ?? '-'}%</b></div>
        <div className="card">일간손익<br /><b>{data?.daily_pnl ?? '-'}</b></div>
      </div>
    </main>
  )
}
