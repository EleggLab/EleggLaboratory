"use client"
import { useState } from 'react'

export default function ManualOrderPage() {
  const [result, setResult] = useState<string>('')
  const [form, setForm] = useState({
    ticker: '005930',
    side: 'buy',
    intent: 'enter',
    target_weight_pct: 10,
    trigger_type: 'none',
    trigger_price: '',
    order_type: 'market',
    order_price: ''
  })

  const submit = async () => {
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
    const payload: any = { source: 'manual', ...form, execution_safety: { review_required: false } }
    if (!payload.trigger_price) delete payload.trigger_price
    if (!payload.order_price) delete payload.order_price
    payload.target_weight_pct = Number(payload.target_weight_pct)
    const res = await fetch(`${base}/api/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    setResult(JSON.stringify(await res.json(), null, 2))
  }

  return (
    <main>
      <h2>Manual Order</h2>
      <div className="card" style={{maxWidth: 560}}>
        {['ticker','side','intent','target_weight_pct','trigger_type','trigger_price','order_type','order_price'].map((k) => (
          <div key={k} style={{marginBottom: 10}}>
            <label>{k}</label>
            <input value={(form as any)[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} />
          </div>
        ))}
        <button onClick={submit}>주문 제출</button>
      </div>
      <pre className="card">{result}</pre>
    </main>
  )
}
