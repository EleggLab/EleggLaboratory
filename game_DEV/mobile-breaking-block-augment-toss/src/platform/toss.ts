import { getUserKeyForGame } from '@apps-in-toss/web-framework';
import type { GameIdentity, GameIdentityStatus } from '../game/types';

const FALLBACK_DEVICE_KEY = 'bounce-stack-device-key';

function ensureFallbackKey() {
  if (typeof window === 'undefined') {
    return 'bounce-stack-ssr';
  }

  const current = window.localStorage.getItem(FALLBACK_DEVICE_KEY);
  if (current) {
    return current;
  }

  const fallback = `local-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(FALLBACK_DEVICE_KEY, fallback);
  return fallback;
}

function buildFallback(status: GameIdentityStatus): GameIdentity {
  return {
    key: ensureFallbackKey(),
    source: 'fallback',
    status,
  };
}

export async function resolveGameIdentity(): Promise<GameIdentity> {
  try {
    const result = await getUserKeyForGame();

    if (!result) {
      return buildFallback('fallback-unsupported-version');
    }

    if (result === 'INVALID_CATEGORY') {
      return buildFallback('fallback-invalid-category');
    }

    if (result === 'ERROR') {
      return buildFallback('fallback-runtime-error');
    }

    if (result.type === 'HASH') {
      return {
        key: result.hash,
        source: 'toss',
        status: 'ready',
      };
    }
  } catch {
    return buildFallback('fallback-local');
  }

  return buildFallback('fallback-local');
}

export function describeIdentityStatus(status: GameIdentityStatus) {
  switch (status) {
    case 'ready':
      return '토스 게임 식별키로 안전하게 저장 중입니다.';
    case 'fallback-invalid-category':
      return '현재 환경이 게임 카테고리가 아니라 로컬 저장 모드로 실행 중입니다.';
    case 'fallback-unsupported-version':
      return '지원 버전 확인 전까지 로컬 테스트 키로 실행 중입니다.';
    case 'fallback-runtime-error':
      return '게임 식별키 조회에 실패해 임시 로컬 키로 이어서 테스트합니다.';
    case 'fallback-local':
    default:
      return '브라우저 개발 환경이라 로컬 테스트 키를 사용하고 있습니다.';
  }
}
