import React from 'react';
import { StyleSheet, View } from 'react-native';

export function TigerIconVisual(): React.JSX.Element {
  return (
    <View style={styles.scene}>
      <View style={styles.canvas}>
        <View style={styles.shardLarge} />
        <View style={styles.shardSmall} />
        <View style={styles.pebble} />
        <View style={styles.grassLeft} />
        <View style={styles.grassRight} />
        <View style={styles.rockRear} />
        <View style={styles.rockBase} />
        <View style={styles.rockFront} />
        <View style={styles.tail} />
        <View style={styles.backLegRear} />
        <View style={styles.backLegFront} />
        <View style={styles.frontLegRear} />
        <View style={styles.body}>
          <View style={styles.bodyLight} />
          <View style={styles.bodyShoulder} />
          <View style={[styles.stripe, styles.stripeBack]} />
          <View style={[styles.stripe, styles.stripeMid]} />
          <View style={[styles.stripe, styles.stripeFront]} />
        </View>
        <View style={styles.chest} />
        <View style={styles.frontLegNear} />
        <View style={styles.head}>
          <View style={styles.earFar} />
          <View style={styles.earNear} />
          <View style={styles.muzzle} />
          <View style={styles.jaw} />
          <View style={styles.eye} />
          <View style={styles.faceStripeLong} />
          <View style={[styles.faceStripe, styles.faceStripeTop]} />
          <View style={[styles.faceStripe, styles.faceStripeMid]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: '#F7F2E6',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.02 }],
  },
  shardLarge: {
    position: 'absolute',
    top: 8,
    right: 14,
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#8E5F5A',
    transform: [{ rotate: '43deg' }],
  },
  shardSmall: {
    position: 'absolute',
    top: 16,
    right: 60,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#98706B',
    transform: [{ rotate: '22deg' }],
  },
  pebble: {
    position: 'absolute',
    bottom: 10,
    left: 66,
    width: 14,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#7C6368',
    transform: [{ rotate: '6deg' }],
  },
  grassLeft: {
    position: 'absolute',
    left: 8,
    bottom: 18,
    width: 10,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#9D966E',
    transform: [{ rotate: '24deg' }],
  },
  grassRight: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    width: 9,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#8A865C',
    transform: [{ rotate: '-18deg' }],
  },
  rockRear: {
    position: 'absolute',
    left: 8,
    bottom: 16,
    width: 30,
    height: 13,
    borderRadius: 6,
    backgroundColor: '#5E434B',
    transform: [{ rotate: '-6deg' }],
  },
  rockBase: {
    position: 'absolute',
    left: 18,
    right: 20,
    bottom: 15,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6B4E53',
  },
  rockFront: {
    position: 'absolute',
    right: 6,
    bottom: 17,
    width: 34,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#8A6A70',
    transform: [{ rotate: '-16deg' }],
  },
  tail: {
    position: 'absolute',
    left: 12,
    bottom: 48,
    width: 28,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#6F4E57',
    transform: [{ rotate: '-18deg' }],
  },
  backLegRear: {
    position: 'absolute',
    left: 34,
    bottom: 26,
    width: 10,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#6A4C57',
    transform: [{ rotate: '5deg' }],
  },
  backLegFront: {
    position: 'absolute',
    left: 48,
    bottom: 26,
    width: 11,
    height: 33,
    borderRadius: 6,
    backgroundColor: '#5B404B',
    transform: [{ rotate: '-5deg' }],
  },
  frontLegRear: {
    position: 'absolute',
    right: 42,
    bottom: 26,
    width: 10,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#7B5562',
  },
  body: {
    position: 'absolute',
    left: 32,
    right: 36,
    bottom: 44,
    height: 32,
    borderRadius: 18,
    backgroundColor: '#D59D70',
    transform: [{ skewX: '-10deg' }],
  },
  bodyLight: {
    position: 'absolute',
    left: 18,
    right: 8,
    bottom: 5,
    height: 13,
    borderRadius: 10,
    backgroundColor: '#ECDCB9',
    opacity: 0.95,
  },
  bodyShoulder: {
    position: 'absolute',
    right: 6,
    top: 2,
    width: 24,
    height: 18,
    borderRadius: 10,
    backgroundColor: '#C58D63',
    transform: [{ rotate: '-8deg' }],
  },
  stripe: {
    position: 'absolute',
    width: 7,
    height: 15,
    borderRadius: 6,
    backgroundColor: '#6F4750',
    opacity: 0.95,
  },
  stripeBack: {
    left: 14,
    top: 3,
    transform: [{ rotate: '-18deg' }],
  },
  stripeMid: {
    left: 32,
    top: 5,
    height: 14,
    transform: [{ rotate: '12deg' }],
  },
  stripeFront: {
    right: 18,
    top: 4,
    height: 13,
    transform: [{ rotate: '-12deg' }],
  },
  chest: {
    position: 'absolute',
    right: 34,
    bottom: 40,
    width: 22,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#EEDFC0',
    transform: [{ rotate: '-12deg' }],
  },
  frontLegNear: {
    position: 'absolute',
    right: 26,
    bottom: 26,
    width: 11,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#C89469',
  },
  head: {
    position: 'absolute',
    right: 10,
    bottom: 49,
    width: 30,
    height: 20,
    borderRadius: 13,
    backgroundColor: '#B67B59',
    transform: [{ rotate: '-4deg' }],
  },
  earFar: {
    position: 'absolute',
    top: -3,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 3,
    backgroundColor: '#6F4750',
    transform: [{ rotate: '-28deg' }],
  },
  earNear: {
    position: 'absolute',
    top: -2,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 3,
    backgroundColor: '#5D3942',
    transform: [{ rotate: '20deg' }],
  },
  muzzle: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 14,
    height: 9,
    borderRadius: 7,
    backgroundColor: '#F3E5C7',
  },
  jaw: {
    position: 'absolute',
    right: -1,
    bottom: 2,
    width: 11,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#E7D3AF',
    transform: [{ rotate: '6deg' }],
  },
  eye: {
    position: 'absolute',
    right: 10,
    top: 6,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#4A2E34',
  },
  faceStripeLong: {
    position: 'absolute',
    left: 6,
    top: 3,
    width: 6,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#6E4650',
    transform: [{ rotate: '18deg' }],
  },
  faceStripe: {
    position: 'absolute',
    width: 4,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6E4650',
  },
  faceStripeTop: {
    left: 11,
    top: 3,
    transform: [{ rotate: '22deg' }],
  },
  faceStripeMid: {
    left: 15,
    top: 8,
    width: 4,
    height: 6,
    transform: [{ rotate: '-16deg' }],
  },
});
