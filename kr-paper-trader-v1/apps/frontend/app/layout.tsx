import './styles.css'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/manual-order">Manual Order</Link>
          <Link href="/ai-review">AI Review</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/live">Live Monitor</Link>
          <Link href="/market-admin">Market Admin</Link>
          <Link href="/settings/risk">Risk Settings</Link>
        </nav>
        <div className="container">{children}</div>
      </body>
    </html>
  )
}
