import { getUserKeyForGame } from '@apps-in-toss/web-framework';
import type { GameIdentity } from '../game/types';

const FALLBACK_DEVICE_KEY = 'magical-potion-device-key';

function ensureFallbackKey() {
  if (typeof window === 'undefined') {
    return 'magical-potion-ssr';
  }

  const current = window.localStorage.getItem(FALLBACK_DEVICE_KEY);
  if (current) {
    return current;
  }

  const fallback = `local-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(FALLBACK_DEVICE_KEY, fallback);
  return fallback;
}

export async function resolveGameIdentity(): Promise<GameIdentity> {
  try {
    const result = await getUserKeyForGame();

    if (!result) {
      return {
        key: ensureFallbackKey(),
        source: 'fallback',
        status: 'fallback-unsupported-version',
      };
    }

    if (result === 'INVALID_CATEGORY') {
      return {
        key: ensureFallbackKey(),
        source: 'fallback',
        status: 'fallback-invalid-category',
      };
    }

    if (result === 'ERROR') {
      return {
        key: ensureFallbackKey(),
        source: 'fallback',
        status: 'fallback-runtime-error',
      };
    }

    if (result.type === 'HASH') {
      return {
        key: result.hash,
        source: 'toss',
        status: 'ready',
      };
    }
  } catch {
    return {
      key: ensureFallbackKey(),
      source: 'fallback',
      status: 'fallback-local',
    };
  }

  return {
    key: ensureFallbackKey(),
    source: 'fallback',
    status: 'fallback-local',
  };
}

export function describeIdentityStatus(status: GameIdentity['status']) {
  switch (status) {
    case 'ready':
      return '토스 게임 로그인으로 저장 키를 불러왔습니다.';
    case 'fallback-invalid-category':
      return '현재 환경은 게임 카테고리가 아니어서 로컬 테스트 키로 실행 중입니다.';
    case 'fallback-unsupported-version':
      return '토스앱 버전이 낮거나 일반 브라우저라 로컬 테스트 키로 실행 중입니다.';
    case 'fallback-runtime-error':
      return '게임 로그인 호출이 실패해 로컬 테스트 키로 이어갑니다.';
    case 'fallback-local':
    default:
      return '로컬 브라우저 개발 환경이라 임시 저장 키를 사용 중입니다.';
  }
}
