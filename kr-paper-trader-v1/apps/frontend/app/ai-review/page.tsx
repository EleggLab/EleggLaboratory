async function getPlan() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
  const res = await fetch(`${base}/api/ai/plan/generate`, { method: 'POST', cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function AIReviewPage() {
  const plan = await getPlan()
  return (
    <main>
      <h2>AI Plan Review (Daily)</h2>
      <p>기본값: review_required</p>
      <pre className="card">{JSON.stringify(plan, null, 2)}</pre>
    </main>
  )
}
