import { createRoute } from '@granite-js/react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import {
  ASTRA_AFFECTION_MAX,
  ASTRA_CHECKLIST_FEATURES,
  ASTRA_CHECKLIST_LABELS,
  bootstrapAstraAffinityState,
  registerAstraInteraction,
  subscribeAstraAffinityState,
  updateAstraLastVariantId,
  type AstraAffinityState,
} from '../src/features/astra/affection';
import {
  buildAstraDialogueLine,
  getNextSessionAstraVariant,
  getSessionAstraVariant,
} from '../src/features/astra/dialogue';
import { ASTRA_VARIANTS, type AstraVariantManifest } from '../src/features/astra/generatedManifest';
import { astraStillSource } from '../src/features/assets/remote';
import { BottomTabs } from '../src/ui/BottomTabs';
import { APP_THEME } from '../src/ui/theme';
import { useTopLevelBackBehavior } from '../src/ui/useTopLevelBackBehavior';

export const Route = createRoute('/', {
  component: Page,
});

const FALLBACK_LINE =
  '\uC544\uC2A4\uD2B8\uB77C\uC608\uC694. \uC624\uB298\uC740 \uC81C\uAC00 \uD750\uB984\uC744 \uBA3C\uC800 \uC815\uB9AC\uD574 \uB4DC\uB9B4\uAC8C\uC694.';
const LABEL_CHECKLIST = '\uC624\uB298 \uCCB4\uD06C';
const LABEL_CHECKLIST_REWARD = '\uC624\uB298 \uC804\uCCB4 \uC644\uB8CC +1';
const LABEL_AFFECTION = '\uD638\uAC10\uB3C4';
const LABEL_ASTRA = '\uC544\uC2A4\uD2B8\uB77C :';
const TOUCH_FX_SIZE = 108;
const TOUCH_FX_LIFETIME_MS = 560;
const IMAGE_SWAP_TAP_COUNT = 5;
const BACKGROUND_DRIFT_DISTANCE_X = 10;
const BACKGROUND_DRIFT_DISTANCE_Y = 14;
const BACKGROUND_DRIFT_PHASE_MS = 18000;

type TouchFx = {
  id: number;
  x: number;
  y: number;
  progress: Animated.Value;
};

type AstraFocus = {
  scale: number;
  translateX: number;
  translateY: number;
};

const ASTRA_FOCUS_OVERRIDES: Record<string, Partial<AstraFocus>> = {
  'smile-trust-front': { scale: 1.03, translateY: -8 },
  'bright-smile-comfort': { scale: 1.03, translateY: -12 },
  'gray-neutral': { scale: 1.04, translateY: -6 },
  'window-flutter': { scale: 1.04, translateY: -16 },
  'sphere-destiny-link': { scale: 1.06, translateY: -12 },
  'folded-arms-observe': { scale: 1.06, translateY: -8 },
  'dark-room-vulnerable': { scale: 1.08, translateY: -18 },
  'crying-dependent': { scale: 1.08, translateY: -16 },
  'dark-hand-allure-danger': { scale: 1.06, translateY: -10 },
};

function buildAstraFocus(slug: string | undefined, width: number, height: number): AstraFocus {
  const compactWidth = width < 380;
  const compactHeight = height < 760;
  const base: AstraFocus = {
    scale: compactHeight ? 1.05 : compactWidth ? 1.03 : 1.01,
    translateX: 0,
    translateY: compactHeight ? -12 : -6,
  };
  const override = slug ? ASTRA_FOCUS_OVERRIDES[slug] : undefined;
  return {
    scale: override?.scale ?? base.scale,
    translateX: override?.translateX ?? base.translateX,
    translateY: override?.translateY ?? base.translateY,
  };
}

function defaultAstraDialogueLine(variant: AstraVariantManifest | null, affection: number): string {
  if (!variant) {
    return FALLBACK_LINE;
  }
  return buildAstraDialogueLine(variant, affection, null, 'intro') || FALLBACK_LINE;
}

function ChecklistPanel({
  state,
  compactWidth,
  compactHeight,
}: {
  state: AstraAffinityState | null;
  compactWidth: boolean;
  compactHeight: boolean;
}): React.JSX.Element {
  const completedByFeature = state?.completedByFeature;
  const completionCount = ASTRA_CHECKLIST_FEATURES.filter((feature) => completedByFeature?.[feature]).length;
  const rewardGranted =
    !!state?.completionRewardGrantedDateKey && state.completionRewardGrantedDateKey === state.checklistDateKey;

  return (
    <View
      style={[
        styles.checklistCard,
        compactWidth && styles.checklistCardCompactWidth,
        compactHeight && styles.checklistCardCompactHeight,
        rewardGranted && styles.checklistCardRewarded,
      ]}
    >
      <View style={styles.checklistHeader}>
        <Text style={styles.checklistTitle}>{LABEL_CHECKLIST}</Text>
        <Text style={styles.checklistCount}>
          {completionCount}/{ASTRA_CHECKLIST_FEATURES.length}
        </Text>
      </View>
      <View style={styles.checklistGrid}>
        {ASTRA_CHECKLIST_FEATURES.map((feature) => {
          const done = !!completedByFeature?.[feature];
          return (
            <View key={feature} style={styles.checklistItem}>
              <View style={[styles.checklistDot, done && styles.checklistDotDone]} />
              <Text numberOfLines={1} style={[styles.checklistLabel, done && styles.checklistLabelDone]}>
                {ASTRA_CHECKLIST_LABELS[feature]}
              </Text>
            </View>
          );
        })}
      </View>
      {rewardGranted ? <Text style={styles.checklistReward}>{LABEL_CHECKLIST_REWARD}</Text> : null}
    </View>
  );
}

function Page(): React.JSX.Element {
  const navigation = Route.useNavigation();
  const params = (Route.useParams() ?? {}) as Record<string, unknown>;
  const resetToken = typeof params.reset === 'string' ? params.reset : '';
  const { width, height } = useWindowDimensions();

  const [affinityState, setAffinityState] = useState<AstraAffinityState | null>(null);
  const [variant, setVariant] = useState<AstraVariantManifest | null>(null);
  const [lineText, setLineText] = useState(FALLBACK_LINE);
  const [touchEffects, setTouchEffects] = useState<TouchFx[]>([]);
  const [displayedRemoteUri, setDisplayedRemoteUri] = useState<string | null>(null);

  const tapCountRef = useRef(0);
  const touchFxIdRef = useRef(0);
  const imageLoadRequestRef = useRef(0);
  const backgroundDriftX = useRef(new Animated.Value(0)).current;
  const backgroundDriftY = useRef(new Animated.Value(0)).current;
  const dialogueReveal = useRef(new Animated.Value(1)).current;
  const backgroundImageOpacity = useRef(new Animated.Value(0)).current;
  const compactWidth = width < 380;
  const compactHeight = height < 760;
  const fallbackVariant = ASTRA_VARIANTS[0] ?? null;
  const displayLineText =
    typeof lineText === 'string' && lineText.trim().length > 0
      ? lineText
      : defaultAstraDialogueLine(variant ?? fallbackVariant, affinityState?.affection ?? 1);
  const imageFocus = useMemo(
    () => buildAstraFocus(variant?.slug ?? fallbackVariant?.slug, width, height),
    [fallbackVariant?.slug, height, variant?.slug, width],
  );

  useTopLevelBackBehavior({ activePath: '/', navigation });

  const refreshAstraState = useCallback(async (): Promise<void> => {
    try {
      const bootstrappedState = await bootstrapAstraAffinityState();
      const pickedVariant = getSessionAstraVariant(
        bootstrappedState.affection,
        bootstrappedState.lastVariantId,
      );
      const persistedState = await updateAstraLastVariantId(bootstrappedState, pickedVariant.id);
      const nextLine =
        buildAstraDialogueLine(pickedVariant, persistedState.affection, null, 'intro') ||
        defaultAstraDialogueLine(pickedVariant, persistedState.affection);

      setAffinityState(persistedState);
      setVariant(pickedVariant);
      setLineText(nextLine);
    } catch {
      setLineText(FALLBACK_LINE);
    }
  }, []);

  const visualSource = useMemo(() => {
    const slug = variant?.slug ?? fallbackVariant?.slug;
    const source = slug ? astraStillSource(slug) : undefined;
    return source ? { uri: source.uri } : undefined;
  }, [fallbackVariant?.slug, variant?.slug]);

  const bundledStillSource = useMemo(
    () => variant?.still ?? fallbackVariant?.still ?? undefined,
    [fallbackVariant?.still, variant?.still],
  );

  useEffect(() => {
    const drift = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(backgroundDriftX, {
            toValue: BACKGROUND_DRIFT_DISTANCE_X,
            duration: BACKGROUND_DRIFT_PHASE_MS,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(backgroundDriftY, {
            toValue: -BACKGROUND_DRIFT_DISTANCE_Y,
            duration: BACKGROUND_DRIFT_PHASE_MS,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(backgroundDriftX, {
            toValue: -BACKGROUND_DRIFT_DISTANCE_X * 0.65,
            duration: BACKGROUND_DRIFT_PHASE_MS + 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(backgroundDriftY, {
            toValue: BACKGROUND_DRIFT_DISTANCE_Y * 0.55,
            duration: BACKGROUND_DRIFT_PHASE_MS + 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(backgroundDriftX, {
            toValue: 0,
            duration: BACKGROUND_DRIFT_PHASE_MS - 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(backgroundDriftY, {
            toValue: 0,
            duration: BACKGROUND_DRIFT_PHASE_MS - 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    drift.start();

    return () => {
      drift.stop();
    };
  }, [backgroundDriftX, backgroundDriftY]);

  useEffect(() => {
    dialogueReveal.setValue(0);

    Animated.parallel([
      Animated.timing(dialogueReveal, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [dialogueReveal, lineText]);

  useEffect(() => {
    const targetUri = visualSource?.uri;

    if (!targetUri) {
      setDisplayedRemoteUri(null);
      backgroundImageOpacity.setValue(0);
      return;
    }

    if (displayedRemoteUri === targetUri) {
      return;
    }

    const requestId = imageLoadRequestRef.current + 1;
    imageLoadRequestRef.current = requestId;
    backgroundImageOpacity.setValue(0);

    let cancelled = false;

    void Image.prefetch(targetUri)
      .catch(() => false)
      .then((loaded) => {
        if (cancelled || requestId !== imageLoadRequestRef.current || !loaded) {
          return;
        }

        setDisplayedRemoteUri(targetUri);
        Animated.timing(backgroundImageOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });

    return () => {
      cancelled = true;
    };
  }, [backgroundImageOpacity, displayedRemoteUri, visualSource?.uri]);

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
        const nextLine =
          buildAstraDialogueLine(pickedVariant, persistedState.affection, null, 'intro') ||
          defaultAstraDialogueLine(pickedVariant, persistedState.affection);

        if (!mounted) return;
        setAffinityState(persistedState);
        setVariant(pickedVariant);
        setLineText(nextLine);
        tapCountRef.current = 0;
      } catch {
        if (!mounted) return;
        setLineText(FALLBACK_LINE);
      }
    };

    void loadAstra();

    return () => {
      mounted = false;
    };
  }, [resetToken]);

  useEffect(() => {
    const navAny = navigation as unknown as {
      addListener?: (
        eventName: string,
        listener: () => void,
      ) => (() => void) | { remove?: () => void };
    };

    if (!navAny.addListener) {
      return;
    }

    const unsubscribe = navAny.addListener('focus', () => {
      void refreshAstraState();
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
        return;
      }
      unsubscribe?.remove?.();
    };
  }, [navigation, refreshAstraState]);

  useEffect(() => {
    return subscribeAstraAffinityState((nextState) => {
      setAffinityState(nextState);
    });
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

  const handleTap = useCallback(
    async (event: GestureResponderEvent): Promise<void> => {
      spawnTouchEffect(event.nativeEvent.locationX, event.nativeEvent.locationY);

      if (!affinityState || !variant) {
        return;
      }

      const interactionResult = await registerAstraInteraction(affinityState);
      let nextState = interactionResult.state;
      let nextVariant = variant;
      tapCountRef.current += 1;

      if (tapCountRef.current % IMAGE_SWAP_TAP_COUNT === 0) {
        const swappedVariant = getNextSessionAstraVariant(nextState.affection, variant.id);
        if (swappedVariant.id !== variant.id) {
          nextVariant = swappedVariant;
          nextState = await updateAstraLastVariantId(nextState, swappedVariant.id);
          setVariant(swappedVariant);
        }
      }

      const nextLine = buildAstraDialogueLine(
        nextVariant,
        nextState.affection,
        displayLineText,
        tapCountRef.current % IMAGE_SWAP_TAP_COUNT === 0 ? 'swap' : 'tap',
      );

      setAffinityState(nextState);
      setLineText(nextLine);
    },
    [affinityState, displayLineText, spawnTouchEffect, variant],
  );

  const handleHomeReselect = useCallback(() => {
    tapCountRef.current = 0;
    setTouchEffects([]);
    setLineText(defaultAstraDialogueLine(variant, affinityState?.affection ?? 1));
    void refreshAstraState();
  }, [affinityState?.affection, refreshAstraState, variant]);

  return (
    <View style={styles.screen}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.backgroundMotionShell,
          {
            transform: [{ translateX: backgroundDriftX }, { translateY: backgroundDriftY }],
          },
        ]}
      >
        {bundledStillSource ? (
          <Animated.Image
            source={bundledStillSource}
            style={[
              styles.backgroundImage,
              {
                transform: [
                  { translateX: imageFocus.translateX },
                  { translateY: imageFocus.translateY },
                  { scale: imageFocus.scale },
                ],
              },
            ]}
            resizeMode="cover"
          />
        ) : null}

        {displayedRemoteUri ? (
          <Animated.Image
            source={{ uri: displayedRemoteUri }}
            style={[
              styles.backgroundImage,
              {
                opacity: backgroundImageOpacity,
                transform: [
                  { translateX: imageFocus.translateX },
                  { translateY: imageFocus.translateY },
                  { scale: imageFocus.scale },
                ],
              },
            ]}
            resizeMode="cover"
          />
        ) : null}

        {!bundledStillSource && !displayedRemoteUri ? (
          <View style={[styles.backgroundPlaceholder, styles.backgroundImage]}>
            <Text style={styles.backgroundPlaceholderLabel}>ASTRA</Text>
          </View>
        ) : null}
      </Animated.View>

      <Pressable style={styles.touchSurface} onPress={(event) => void handleTap(event)}>
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
                    inputRange: [0, 0.14, 1],
                    outputRange: [0, 0.74, 0],
                  }),
                  transform: [
                    {
                      scale: effect.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.14, 1.32],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.touchFxGlow} />
              <View style={styles.touchFxRing} />
              <View style={styles.touchFxRingSoft} />
              <View style={styles.touchFxCore} />
            </Animated.View>
          ))}
        </View>

        <View
          style={[
            styles.topRow,
            compactWidth && styles.topRowCompactWidth,
            compactHeight && styles.topRowCompactHeight,
          ]}
        >
          <ChecklistPanel state={affinityState} compactWidth={compactWidth} compactHeight={compactHeight} />
          <View style={styles.affectionPill}>
            <Text style={styles.affectionHeart}>{'\u2665'}</Text>
            <Text style={styles.affectionText}>
              {LABEL_AFFECTION} {(affinityState?.affection ?? 1)}/{ASTRA_AFFECTION_MAX}
            </Text>
          </View>
        </View>

        <View style={styles.flexSpacer} />

        <View style={styles.dialogueSlot}>
          <Animated.View
            style={[
              styles.dialogueCard,
              compactWidth && styles.dialogueCardCompactWidth,
              compactHeight && styles.dialogueCardCompactHeight,
              {
                opacity: dialogueReveal,
                transform: [
                  {
                    translateY: dialogueReveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.dialogueHeader}>
              <Text style={styles.dialogueName}>{LABEL_ASTRA}</Text>
            </View>
            <Text style={[styles.dialogueText, compactWidth && styles.dialogueTextCompact]}>{displayLineText}</Text>
          </Animated.View>
        </View>
      </Pressable>

      <View style={styles.tabsSlot}>
        <BottomTabs activePath="/" navigation={navigation} onReselect={handleHomeReselect} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_THEME.colors.bg,
  },
  backgroundMotionShell: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  backgroundImage: {
    position: 'absolute',
    top: -18,
    left: -16,
    right: -16,
    bottom: -8,
    width: undefined,
    height: undefined,
  },
  backgroundPlaceholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  backgroundPlaceholderLabel: {
    fontSize: 24,
    letterSpacing: 2,
  },
  touchSurface: {
    flex: 1,
    paddingTop: Math.max(StatusBar.currentHeight ?? 0, 8) + 10,
    justifyContent: 'space-between',
  },
  touchFxLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  touchFxShell: {
    position: 'absolute',
    width: TOUCH_FX_SIZE,
    height: TOUCH_FX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchFxGlow: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 229, 166, 0.08)',
  },
  touchFxRing: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 999,
    borderWidth: 1.6,
    borderColor: 'rgba(255, 232, 177, 0.74)',
    backgroundColor: 'rgba(255, 232, 177, 0.04)',
  },
  touchFxRingSoft: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 220, 0.34)',
  },
  touchFxCore: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 239, 198, 0.16)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 15,
    paddingTop: 2,
  },
  topRowCompactWidth: {
    paddingHorizontal: 14,
    gap: 10,
  },
  topRowCompactHeight: {
    paddingTop: 2,
  },
  checklistCard: {
    flex: 1,
    maxWidth: 170,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(8, 13, 28, 0.54)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  checklistCardCompactWidth: {
    maxWidth: 164,
    paddingHorizontal: 7,
  },
  checklistCardCompactHeight: {
    paddingVertical: 4,
  },
  checklistCardRewarded: {
    borderColor: 'rgba(247, 201, 72, 0.44)',
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  checklistTitle: {
    color: '#F7F4EE',
    fontSize: 9.2,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  checklistCount: {
    color: '#FFD979',
    fontSize: 9.2,
    fontWeight: '900',
  },
  checklistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,
    columnGap: 6,
  },
  checklistItem: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checklistDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  checklistDotDone: {
    borderColor: '#FFD979',
    backgroundColor: '#FFD979',
  },
  checklistLabel: {
    flex: 1,
    color: 'rgba(247, 244, 238, 0.86)',
    fontSize: 9.4,
    fontWeight: '800',
  },
  checklistLabelDone: {
    color: '#FFFFFF',
  },
  checklistReward: {
    color: '#FFD979',
    fontSize: 8.9,
    fontWeight: '900',
  },
  affectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(8, 13, 28, 0.64)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  affectionHeart: {
    color: '#FFD979',
    fontSize: 14,
    fontWeight: '900',
  },
  affectionText: {
    color: '#F7F4EE',
    fontSize: 11,
    fontWeight: '800',
  },
  flexSpacer: {
    flex: 1,
  },
  dialogueSlot: {
    paddingHorizontal: 15,
    paddingBottom: 14,
  },
  dialogueCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(8, 13, 28, 0.63)',
    paddingHorizontal: 22,
    paddingVertical: 16,
    gap: 8,
    minHeight: 128,
  },
  dialogueCardCompactWidth: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 118,
  },
  dialogueCardCompactHeight: {
    borderRadius: 20,
    minHeight: 112,
  },
  dialogueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  dialogueName: {
    color: '#FFD979',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  dialogueText: {
    color: '#F2F1EF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 24,
  },
  dialogueTextCompact: {
    fontSize: 15,
    lineHeight: 22,
  },
  tabsSlot: {
    backgroundColor: 'transparent',
  },
});
