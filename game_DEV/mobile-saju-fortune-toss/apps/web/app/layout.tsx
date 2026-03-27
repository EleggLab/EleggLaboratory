import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saju Vibe Lab',
  description: '재현 가능한 사주 계산 + 근거 중심 해석 + 분야별 Q&A',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="ko">
      <body>
        <div className="phone-shell">
          <div className="phone">{children}</div>
        </div>
      </body>
    </html>
  );
}

