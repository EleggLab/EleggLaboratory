import { useEffect, useMemo } from 'react';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { UI } from '../lib/ui/tokens';

const WEB_PHONE_ASPECT = 390 / 844; // iPhone-ish (width / height)
const WEB_FRAME_MIN_W = 320;
const WEB_FRAME_MAX_W = 430;
const WEB_FRAME_MIN_H = Math.round(WEB_FRAME_MIN_W / WEB_PHONE_ASPECT);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps): React.JSX.Element {
  return (
    <View style={styles.errorRoot}>
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>일시적인 오류가 발생했어요</Text>
        <Text style={styles.errorDesc}>앱을 다시 시도하면 대부분 바로 복구됩니다.</Text>
        <Text style={styles.errorMeta} numberOfLines={3}>
          {error.message}
        </Text>
        <Pressable onPress={() => void retry()} style={({ pressed }) => [styles.errorBtn, pressed && styles.errorBtnPressed]}>
          <Text style={styles.errorBtnText}>다시 시도</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RootLayout(): React.JSX.Element {
  const { width: vw, height: vh } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const doc = (globalThis as { document?: any }).document;
    if (!doc) return;
    const htmlEl = doc.documentElement;
    const bodyEl = doc.body;
    const rootEl = doc.getElementById('root');

    if (htmlEl?.style) {
      htmlEl.style.backgroundColor = UI.colors.ink;
      htmlEl.style.margin = '0';
      htmlEl.style.height = '100%';
      htmlEl.style.overflow = 'hidden';
    }
    if (bodyEl?.style) {
      bodyEl.style.backgroundColor = UI.colors.ink;
      bodyEl.style.margin = '0';
      bodyEl.style.height = '100%';
      bodyEl.style.overflow = 'hidden';
    }
    if (rootEl?.style) {
      rootEl.style.backgroundColor = UI.colors.ink;
      rootEl.style.height = '100%';
      rootEl.style.width = '100%';
    }
  }, []);

  const webFrameStyle = useMemo(() => {
    if (Platform.OS !== 'web') return null;

    // Match a typical phone ratio for web preview and never let the frame collapse to a line.
    const padX = 24;
    const padY = 36;
    const availW = Number.isFinite(vw) && vw > 0 ? vw - padX : WEB_FRAME_MAX_W;
    const availH = Number.isFinite(vh) && vh > 0 ? vh - padY : WEB_FRAME_MIN_H;

    const widthByViewport = clamp(availW, WEB_FRAME_MIN_W, WEB_FRAME_MAX_W);
    const widthByHeight = clamp(availH * WEB_PHONE_ASPECT, WEB_FRAME_MIN_W, WEB_FRAME_MAX_W);
    const safeW = clamp(Math.min(widthByViewport, widthByHeight), WEB_FRAME_MIN_W, WEB_FRAME_MAX_W);
    const safeH = Math.max(WEB_FRAME_MIN_H, Math.round(safeW / WEB_PHONE_ASPECT));

    return {
      width: safeW,
      height: safeH,
      minWidth: WEB_FRAME_MIN_W,
      minHeight: WEB_FRAME_MIN_H,
    };
  }, [vw, vh]);

  const webOuterViewportStyle = useMemo(() => {
    if (Platform.OS !== 'web') return null;
    const width = Number.isFinite(vw) && vw > 0 ? vw : WEB_FRAME_MAX_W + 24;
    const height = Number.isFinite(vh) && vh > 0 ? vh : WEB_FRAME_MIN_H + 40;
    return {
      width,
      height,
      minHeight: height,
    };
  }, [vw, vh]);

  return (
    <View style={[styles.outer, webOuterViewportStyle]}>
      <View style={[styles.inner, webFrameStyle]}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: UI.colors.ink,
    ...(Platform.OS === 'web'
      ? {
          paddingVertical: 14,
          paddingHorizontal: 12,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }
      : null),
  },
  inner: {
    flex: Platform.OS === 'web' ? 0 : 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    backgroundColor: UI.colors.paper,
    alignSelf: 'stretch',
    alignItems: 'stretch',
    ...(Platform.OS === 'web'
       ? {
           borderRadius: 28,
           overflow: 'hidden',
           borderWidth: 1,
           borderColor: 'rgba(255,255,255,0.10)',
          // RN-web: prefer `boxShadow` over `shadow*` props (which are deprecated on web).
          boxShadow: '0px 18px 28px rgba(0,0,0,0.35)',
         }
       : null),
  },
  errorRoot: {
    flex: 1,
    backgroundColor: UI.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  errorCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(11,16,32,0.88)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  errorTitle: {
    color: '#f2f1ef',
    fontSize: 18,
    fontWeight: '900',
  },
  errorDesc: {
    color: 'rgba(242,241,239,0.84)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  errorMeta: {
    color: 'rgba(242,241,239,0.68)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 4,
  },
  errorBtn: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: UI.colors.gold,
    borderWidth: 1,
    borderColor: UI.colors.gold,
  },
  errorBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  errorBtnText: {
    color: UI.colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
});
