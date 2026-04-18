import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BACKGROUNDS } from '../../lib/assets/backgrounds';
import {
  bootstrapAstraAffinityState,
  registerAstraInteraction,
  updateAstraLastVariantId,
  type AstraAffinityState,
} from '../../lib/features/astra/affection';
import {
  getSessionAstraVariant,
  pickAstraDialogueLine,
} from '../../lib/features/astra/dialogue';
import type { AstraVariantManifest } from '../../lib/features/astra/generatedManifest';

const FALLBACK_LINE = '아스트라가 별빛을 다듬고 있어요. 잠시만 기다려주세요.';
const DEFAULT_LOOP_DURATION_MS = 1600;
const TOUCH_FX_SIZE = 96;
const TOUCH_FX_LIFETIME_MS = 420;

type TouchFx = {
  id: number;
  x: number;
  y: number;
  progress: Animated.Value;
};

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [affinityState, setAffinityState] = useState<AstraAffinityState | null>(null);
  const [variant, setVariant] = useState<AstraVariantManifest | null>(null);
  const [lineText, setLineText] = useState(FALLBACK_LINE);
  const [isLoopPlaying, setIsLoopPlaying] = useState(false);
  const [touchEffects, setTouchEffects] = useState<TouchFx[]>([]);

  const loopTokenRef = useRef(0);
  const touchFxIdRef = useRef(0);

  const dialoguePaddingBottom = useMemo(() => insets.bottom + 20, [insets.bottom]);
  const visualSource = variant?.still ?? BACKGROUNDS.home;
  const loopSource = isLoopPlaying && variant?.loop ? variant.loop : null;

  useEffect(() => {
    let mounted = true;

    const loadAstra = async (): Promise<void> => {
      try {
        const bootstrappedState = await bootstrapAstraAffinityState();
        const pickedVariant = getSessionAstraVariant(
          bootstrappedState.affection,
          bootstrappedState.lastVariantId,
        );
        const persistedState = await updateAstraLastVariantId(bootstrappedState, pickedVariant.id);
        const nextLine = pickAstraDialogueLine(pickedVariant, persistedState.affection);

        if (!mounted) return;
        setAffinityState(persistedState);
        setVariant(pickedVariant);
        setLineText(nextLine || FALLBACK_LINE);

        if (__DEV__) {
          console.log('[astra-home] loaded', {
            variant: pickedVariant.slug,
            hasLoop: Boolean(pickedVariant.loop),
            affection: persistedState.affection,
            tiers: Object.fromEntries(
              Object.entries(pickedVariant.dialogueByTier).map(([tier, lines]) => [tier, lines.length]),
            ),
          });
        }
      } catch {
        if (!mounted) return;
        setLineText(FALLBACK_LINE);
      }
    };

    void loadAstra();

    return () => {
      mounted = false;
      loopTokenRef.current += 1;
    };
  }, []);

  const spawnTouchEffect = useCallback((x: number, y: number): void => {
    const id = touchFxIdRef.current + 1;
    touchFxIdRef.current = id;

    const progress = new Animated.Value(0);
    setTouchEffects((current) => [...current.slice(-2), { id, x, y, progress }]);

    Animated.timing(progress, {
      toValue: 1,
      duration: TOUCH_FX_LIFETIME_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setTouchEffects((current) => current.filter((effect) => effect.id !== id));
    });
  }, []);

  const handleTap = useCallback(async (event: GestureResponderEvent): Promise<void> => {
    spawnTouchEffect(event.nativeEvent.locationX, event.nativeEvent.locationY);

    if (!affinityState || !variant || isLoopPlaying) {
      return;
    }

    const interactionResult = await registerAstraInteraction(affinityState);
    const nextState = interactionResult.state;
    const nextLine = pickAstraDialogueLine(variant, nextState.affection, lineText);

    setAffinityState(nextState);
    setLineText(nextLine || FALLBACK_LINE);

    if (__DEV__) {
      console.log('[astra-home] interaction', {
        variant: variant.slug,
        hasLoop: Boolean(variant.loop),
        didIncrease: interactionResult.didIncrease,
        affection: nextState.affection,
      });
    }

    if (!variant.loop) {
      return;
    }

    const token = loopTokenRef.current + 1;
    loopTokenRef.current = token;
    setIsLoopPlaying(true);

    if (__DEV__) {
      console.log('[astra-home] loop-start', {
        variant: variant.slug,
        durationMs: variant.loopDurationMs ?? DEFAULT_LOOP_DURATION_MS,
      });
    }

    setTimeout(() => {
      if (loopTokenRef.current !== token) {
        return;
      }
      setIsLoopPlaying(false);

      if (__DEV__) {
        console.log('[astra-home] loop-end', {
          variant: variant.slug,
        });
      }
    }, variant.loopDurationMs ?? DEFAULT_LOOP_DURATION_MS);
  }, [affinityState, isLoopPlaying, lineText, spawnTouchEffect, variant]);

  return (
    <View style={styles.screen}>
      <Image fadeDuration={0} source={visualSource} style={styles.backgroundImage} resizeMode="cover" />
      {loopSource ? (
        <Image fadeDuration={0} source={loopSource} style={styles.backgroundImage} resizeMode="cover" />
      ) : null}
      <View style={styles.overlay} />

      <Pressable onPress={(event) => void handleTap(event)} style={styles.tapCanvas}>
        <View pointerEvents="none" style={styles.atmosphere}>
          <LinearGradient
            colors={['rgba(4, 8, 20, 0.28)', 'rgba(4, 8, 20, 0.10)', 'rgba(4, 8, 20, 0)']}
            locations={[0, 0.48, 1]}
            style={styles.topVeil}
          />
          <LinearGradient
            colors={['rgba(4, 8, 20, 0)', 'rgba(4, 8, 20, 0.08)', 'rgba(3, 7, 18, 0.18)', 'rgba(3, 7, 18, 0.34)']}
            locations={[0, 0.28, 0.68, 1]}
            style={styles.bottomCurtain}
          />
          <View style={[styles.glowOrb, styles.glowOrbLeft]} />
          <View style={[styles.glowOrb, styles.glowOrbRight]} />
        </View>
        <View pointerEvents="none" style={styles.touchFxLayer}>
          {touchEffects.map((effect) => (
            <Animated.View
              key={effect.id}
              style={[
                styles.touchFxShell,
                {
                  left: effect.x - TOUCH_FX_SIZE / 2,
                  top: effect.y - TOUCH_FX_SIZE / 2,
                  opacity: effect.progress.interpolate({
                    inputRange: [0, 0.12, 1],
                    outputRange: [0, 0.9, 0],
                  }),
                  transform: [
                    {
                      scale: effect.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.18, 1.7],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.touchFxRing} />
              <View style={styles.touchFxCore} />
            </Animated.View>
          ))}
        </View>

        <View style={[styles.topRow, { paddingTop: insets.top + 14 }]}>
          <View style={styles.affectionPill}>
            <MaterialCommunityIcons name="heart" size={16} color="#ffd979" />
            <Text style={styles.affectionText}>호감도 {(affinityState?.affection ?? 1)}/10</Text>
          </View>
        </View>

        <View style={styles.flexSpacer} />

        <View pointerEvents="none" style={[styles.dialogueSlot, { paddingBottom: dialoguePaddingBottom }]}>
          <View style={styles.dialogueCard}>
            <View style={styles.dialogueHeader}>
              <View style={styles.dialogueAccent} />
              <Text style={styles.dialogueName}>아스트라</Text>
            </View>
            <Text style={styles.dialogueText}>{lineText}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 22, 0.08)',
  },
  tapCanvas: {
    flex: 1,
    justifyContent: 'space-between',
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  touchFxLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  touchFxShell: {
    position: 'absolute',
    width: TOUCH_FX_SIZE,
    height: TOUCH_FX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchFxRing: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 232, 177, 0.92)',
    backgroundColor: 'rgba(255, 232, 177, 0.08)',
  },
  touchFxCore: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 239, 198, 0.22)',
  },
  topVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  bottomCurtain: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 340,
  },
  glowOrb: {
    position: 'absolute',
    bottom: 212,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(135, 171, 255, 0.09)',
  },
  glowOrbLeft: {
    left: -18,
  },
  glowOrbRight: {
    right: -12,
    backgroundColor: 'rgba(206, 171, 255, 0.08)',
  },
  topRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  affectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(8, 13, 28, 0.76)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  affectionText: {
    color: '#f7f4ee',
    fontSize: 12,
    fontWeight: '800',
  },
  flexSpacer: {
    flex: 1,
  },
  dialogueSlot: {
    paddingHorizontal: 20,
  },
  dialogueCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(8, 13, 28, 0.84)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#02040a',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  dialogueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialogueAccent: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffd979',
  },
  dialogueName: {
    color: '#ffd979',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  dialogueText: {
    color: '#f2f1ef',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
  },
});
