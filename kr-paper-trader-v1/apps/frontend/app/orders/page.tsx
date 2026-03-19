async function getOrders() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
  const res = await fetch(`${base}/api/orders`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function OrdersPage() {
  const rows = await getOrders()
  return (
    <main>
      <h2>Orders</h2>
      <pre className="card">{JSON.stringify(rows, null, 2)}</pre>
    </main>
  )
}
