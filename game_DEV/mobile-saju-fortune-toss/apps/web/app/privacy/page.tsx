import type { Metadata } from 'next';
import { APP_STORE_INFO } from '../../lib/appStoreInfo';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'Saju Companion 개인정보처리방침',
};

export default function PrivacyPage(): React.JSX.Element {
  return (
    <main className="container">
      <section className="hero">
        <h1>개인정보처리방침</h1>
        <p>
          {APP_STORE_INFO.appName}은 광고와 인앱결제 없이 제공되는 무료 운세 앱입니다. 마지막 업데이트:
          {' '}
          {APP_STORE_INFO.lastUpdated}
        </p>
      </section>

      <section className="panel" style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem' }}>
        <div>
          <h2>1. 수집하는 정보</h2>
          <p className="meta">
            앱은 회원가입을 요구하지 않습니다. 사용자가 입력한 생년월일시, 성별, 오늘의 타로 결과 같은 일부 데이터는
            기기 내부 저장소에만 보관될 수 있습니다.
          </p>
        </div>

        <div>
          <h2>2. 정보 사용 방식</h2>
          <p className="meta">
            입력 정보는 사주, 타로, 주역, 오늘 운세 기능을 계산하고 다시 보여주기 위한 용도로만 사용됩니다.
          </p>
        </div>

        <div>
          <h2>3. 외부 전송</h2>
          <p className="meta">
            현재 모바일 앱은 광고, 인앱결제, 계정 시스템을 포함하지 않습니다. 핵심 운세 계산과 저장은 기기 내부 기준으로
            동작하도록 구성되어 있습니다.
          </p>
        </div>

        <div>
          <h2>4. 제3자 제공</h2>
          <p className="meta">사용자 입력 정보를 판매하거나 제3자에게 제공하지 않습니다.</p>
        </div>

        <div>
          <h2>5. 보관 및 삭제</h2>
          <p className="meta">
            저장된 정보는 앱 삭제 또는 앱 내 저장 데이터 삭제로 제거할 수 있습니다. 향후 정책이 바뀌면 이 페이지에서
            함께 안내합니다.
          </p>
        </div>

        <div>
          <h2>6. 문의</h2>
          <p className="meta">
            문의 이메일:
            {' '}
            <strong>{APP_STORE_INFO.supportEmail}</strong>
            {' '}
            <br />
            배포 전 실제 지원 이메일로 교체해 주세요.
          </p>
        </div>
      </section>
    </main>
  );
}
