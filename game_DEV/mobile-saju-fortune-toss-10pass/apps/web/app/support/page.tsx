import type { Metadata } from 'next';
import { APP_STORE_INFO } from '../../lib/appStoreInfo';

export const metadata: Metadata = {
  title: '지원',
  description: 'Saju Companion 지원 안내',
};

export default function SupportPage(): React.JSX.Element {
  return (
    <main className="container">
      <section className="hero">
        <h1>지원</h1>
        <p>{APP_STORE_INFO.appName} 사용 중 문제가 있으면 아래 안내를 참고해 주세요.</p>
      </section>

      <section className="panel" style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem' }}>
        <div>
          <h2>자주 확인할 점</h2>
          <ul className="meta" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li>앱을 완전히 종료한 뒤 다시 실행</li>
            <li>입력값 저장이 꼬였을 때 앱 내 저장 데이터를 다시 입력</li>
            <li>타로 / 오늘 운세 결과가 갱신되지 않으면 날짜 기준을 다시 확인</li>
          </ul>
        </div>

        <div>
          <h2>문의 채널</h2>
          <p className="meta">
            이메일:
            {' '}
            <strong>{APP_STORE_INFO.supportEmail}</strong>
            {' '}
            <br />
            배포 전 실제 지원 이메일로 교체해 주세요.
          </p>
        </div>

        <div>
          <h2>앱 정보</h2>
          <p className="meta">
            가격:
            {' '}
            {APP_STORE_INFO.pricing}
            {' '}
            / 광고:
            {' '}
            {APP_STORE_INFO.ads}
            {' '}
            / 인앱결제:
            {' '}
            {APP_STORE_INFO.iap}
          </p>
        </div>
      </section>
    </main>
  );
}
