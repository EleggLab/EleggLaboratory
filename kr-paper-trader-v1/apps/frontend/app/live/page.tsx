"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type AnyObj = Record<string, any>

function wsBaseFromApi(apiBase: string) {
  const u = new URL(apiBase)
  const proto = u.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${u.host}`
}

export default function LivePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
  const wsBase = useMemo(() => wsBaseFromApi(apiBase), [apiBase])

  const [quotes, setQuotes] = useState<AnyObj[]>([])
  const [orders, setOrders] = useState<AnyObj[]>([])
  const [positions, setPositions] = useState<AnyObj[]>([])
  const [dashboard, setDashboard] = useState<AnyObj | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("-")

  const [qState, setQState] = useState("connecting")
  const [oState, setOState] = useState("connecting")
  const [pState, setPState] = useState("connecting")

  const retryRef = useRef<number | null>(null)

  useEffect(() => {
    let closed = false
    const sockets: WebSocket[] = []

    const connect = (path: string, onData: (d: AnyObj) => void, onState: (s: string) => void) => {
      const ws = new WebSocket(`${wsBase}${path}`)
      sockets.push(ws)
      onState("connecting")

      ws.onopen = () => {
        onState("open")
        ws.send("subscribe")
      }
      ws.onclose = () => onState("closed")
      ws.onerror = () => onState("error")
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data)
          onData(msg)
          setLastUpdated(new Date().toLocaleTimeString())
        } catch {}
      }
    }

    const pullDashboard = async () => {
      try {
        const r = await fetch(`${apiBase}/api/dashboard`, { cache: "no-store" })
        if (r.ok) setDashboard(await r.json())
      } catch {}
    }

    const boot = () => {
      connect("/ws/quotes", (m) => setQuotes(m.data || []), setQState)
      connect("/ws/orders", (m) => setOrders(m.data || []), setOState)
      connect("/ws/positions", (m) => setPositions(m.data || []), setPState)
      pullDashboard()
    }

    boot()
    const timer = setInterval(pullDashboard, 3000)

    const reconnect = () => {
      if (closed) return
      sockets.forEach((s) => {
        try { s.close() } catch {}
      })
      boot()
    }

    retryRef.current = window.setInterval(() => {
      if (qState !== "open" || oState !== "open" || pState !== "open") reconnect()
    }, 5000)

    return () => {
      closed = true
      clearInterval(timer)
      if (retryRef.current) clearInterval(retryRef.current)
      sockets.forEach((s) => {
        try { s.close() } catch {}
      })
    }
  }, [apiBase, wsBase])

  return (
    <main>
      <h2>Live Trading Monitor</h2>
      <p>마지막 업데이트: {lastUpdated}</p>
      <div className="grid">
        <div className="card">Quotes WS: <b>{qState}</b></div>
        <div className="card">Orders WS: <b>{oState}</b></div>
        <div className="card">Positions WS: <b>{pState}</b></div>
      </div>

      <div className="card">
        <h3>Dashboard Snapshot</h3>
        <pre>{JSON.stringify(dashboard, null, 2)}</pre>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          <h3>Orders (Realtime)</h3>
          <pre>{JSON.stringify(orders, null, 2)}</pre>
        </div>
        <div className="card">
          <h3>Positions (Realtime)</h3>
          <pre>{JSON.stringify(positions, null, 2)}</pre>
        </div>
      </div>

      <div className="card">
        <h3>Quotes (Realtime)</h3>
        <pre>{JSON.stringify(quotes, null, 2)}</pre>
      </div>
    </main>
  )
}
