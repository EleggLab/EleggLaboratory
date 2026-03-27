import { StyleSheet } from 'react-native';
import { UI } from './tokens';

export const commonStyles = StyleSheet.create({
  screen: {
    padding: UI.space.screenX,
    paddingBottom: UI.space.screenBottom,
    gap: UI.space.gap,
    backgroundColor: UI.colors.paper,
  },
  hero: {
    borderRadius: UI.radius.xl,
    backgroundColor: 'rgba(11,16,32,0.62)',
    paddingHorizontal: UI.space.heroPad,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  heroTitle: {
    color: '#f2f1ef',
    ...UI.type.heroTitle,
  },
  heroSub: {
    color: 'rgba(242,241,239,0.90)',
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: UI.colors.line,
    backgroundColor: UI.colors.card,
    padding: UI.space.cardPad,
  },
  meta: UI.type.meta,
  pre: UI.type.body,
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  primaryBtn: {
    borderRadius: UI.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: UI.colors.ink,
  },
  primaryBtnText: {
    color: '#f2f1ef',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    borderRadius: UI.radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: '#fff6d6',
    borderWidth: 1,
    borderColor: UI.colors.gold,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: UI.colors.text,
  },
});
