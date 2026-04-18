import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function BaseIcon({
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2,
  children,
}: IconProps & {
  children?: React.ReactElement | React.ReactElement[];
}): React.JSX.Element {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children as any}
    </Svg>
  );
}

export function LucideSun({
  size,
  color,
  strokeWidth,
}: IconProps): React.JSX.Element {
  return (
    <BaseIcon size={size} color={color} strokeWidth={strokeWidth}>
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 3v1" />
      <Path d="M12 20v1" />
      <Path d="M3 12h1" />
      <Path d="M20 12h1" />
      <Path d="m18.364 5.636-.707.707" />
      <Path d="m6.343 17.657-.707.707" />
      <Path d="m5.636 5.636.707.707" />
      <Path d="m17.657 17.657.707.707" />
    </BaseIcon>
  );
}

export function LucideSparkles({
  size,
  color,
  strokeWidth,
}: IconProps): React.JSX.Element {
  return (
    <BaseIcon size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <Path d="M20 2v4" />
      <Path d="M22 4h-4" />
      <Circle cx="4" cy="20" r="2" />
    </BaseIcon>
  );
}

export function LucideHouse({
  size,
  color,
  strokeWidth,
}: IconProps): React.JSX.Element {
  return (
    <BaseIcon size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <Path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </BaseIcon>
  );
}

export function LucideGrid({
  size,
  color,
  strokeWidth,
}: IconProps): React.JSX.Element {
  return (
    <BaseIcon size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M12 3v18" />
      <Path d="M3 12h18" />
      <Rect x="3" y="3" width="18" height="18" rx="2" />
    </BaseIcon>
  );
}

export function LucideClock({
  size,
  color,
  strokeWidth,
}: IconProps): React.JSX.Element {
  return (
    <BaseIcon size={size} color={color} strokeWidth={strokeWidth}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v6h4" />
    </BaseIcon>
  );
}
