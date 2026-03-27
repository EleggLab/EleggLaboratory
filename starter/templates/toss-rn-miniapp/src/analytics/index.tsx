import type { PropsWithChildren } from 'react';

export type AnalyticsParams = Record<string, boolean | null | number | string | undefined>;

type AnalyticsComponentProps = PropsWithChildren<{
  enabled?: boolean;
  params?: AnalyticsParams;
}>;

let RuntimeAnalytics: any = null;
try {
  RuntimeAnalytics = require('@apps-in-toss/framework').Analytics ?? null;
} catch {
  RuntimeAnalytics = null;
}

function wrapWithArea(children: React.JSX.Element, params?: AnalyticsParams): React.JSX.Element {
  if (!RuntimeAnalytics?.Area || !params || Object.keys(params).length === 0) {
    return children;
  }

  return <RuntimeAnalytics.Area params={params}>{children}</RuntimeAnalytics.Area>;
}

function init(options: Record<string, unknown>): void {
  if (!RuntimeAnalytics?.init) {
    if (__DEV__) {
      console.info('[toss-analytics] init skipped; runtime analytics unavailable.');
    }
    return;
  }

  RuntimeAnalytics.init(options);
}

function Impression({ children, enabled, params }: AnalyticsComponentProps): React.JSX.Element {
  const inner = RuntimeAnalytics?.Impression ? (
    <RuntimeAnalytics.Impression enabled={enabled}>{children}</RuntimeAnalytics.Impression>
  ) : (
    <>{children}</>
  );

  return wrapWithArea(inner, params);
}

function Press({ children, params }: AnalyticsComponentProps): React.JSX.Element {
  const inner = RuntimeAnalytics?.Press ? <RuntimeAnalytics.Press>{children}</RuntimeAnalytics.Press> : <>{children}</>;
  return wrapWithArea(inner, params);
}

export const Analytics = {
  init,
  Impression,
  Press,
};

export const TOSS_ANALYTICS_EVENT_TAXONOMY = {
  hero: {
    block: 'hero',
    screen: 'home',
  },
  homeFeedBanner: {
    block: 'home_feed_banner',
    screen: 'home',
  },
  supportActions: {
    block: 'support_actions',
    screen: 'support',
  },
} as const;
