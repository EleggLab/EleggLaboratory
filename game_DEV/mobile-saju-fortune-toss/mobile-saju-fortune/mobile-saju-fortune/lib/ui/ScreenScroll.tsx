import { Children, useEffect, useRef } from 'react';
import type { PropsWithChildren } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { Animated, Image, ScrollView, StyleSheet, View } from 'react-native';

import { UI } from './tokens';

export function ScreenScroll({
  background,
  contentContainerStyle,
  contentRevealDelayMs = 140,
  scrollToTopKey,
  resetScrollOnFocus: _resetScrollOnFocus,
  children,
}: PropsWithChildren<{
  background?: ImageSourcePropType;
  contentContainerStyle?: StyleProp<ViewStyle>;
  contentRevealDelayMs?: number;
  scrollToTopKey?: string | number;
  resetScrollOnFocus?: boolean;
}>): React.JSX.Element {
  const scrollRef = useRef<ScrollView>(null);
  const reveal = useRef(new Animated.Value(contentRevealDelayMs > 0 ? 0 : 1)).current;

  useEffect(() => {
    if (contentRevealDelayMs <= 0) {
      reveal.setValue(1);
      return;
    }
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: 220,
      delay: contentRevealDelayMs,
      useNativeDriver: true,
    }).start();
  }, [contentRevealDelayMs, reveal]);

  useEffect(() => {
    if (scrollToTopKey === undefined) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [scrollToTopKey]);

  const revealTranslateY = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });
  const childArray = Children.toArray(children);

  return (
    <View style={styles.root}>
      {background ? (
        <>
          <View style={styles.bgLayer}>
            <Image source={background} style={styles.bgImage} resizeMode="cover" />
          </View>
          <View style={styles.overlay} />
        </>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[contentContainerStyle, styles.content]}
      >
        <Animated.View
          style={[
            styles.revealInner,
            {
              opacity: reveal,
              transform: [{ translateY: revealTranslateY }],
            },
          ]}
        >
          {childArray.map((child, idx) => (
            <View key={idx} style={idx < childArray.length - 1 ? styles.stackItem : undefined}>
              {child}
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: UI.colors.ink,
    overflow: 'hidden',
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    left: '-6%',
    top: '-4%',
    width: '112%',
    height: '108%',
  },
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,241,234,0.22)',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    minWidth: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  revealInner: {
    width: '100%',
    minWidth: '100%',
  },
  stackItem: {
    marginBottom: UI.space.gap,
  },
});
