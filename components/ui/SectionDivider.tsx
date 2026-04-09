import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

interface SectionDividerProps {
  fromColor: string;
  toColor: string;
  height?: number;
}

export default function SectionDivider({ fromColor, toColor, height = 40 }: SectionDividerProps) {
  const w = SCREEN_W;
  const h = height;

  return (
    <Svg width={w} height={h} style={{ display: 'flex' }}>
      <Rect width={w} height={h} fill={fromColor} />
      <Path
        d={`M0,${h} C${w * 0.25},0 ${w * 0.75},${h} ${w},0 L${w},${h} L0,${h} Z`}
        fill={toColor}
      />
    </Svg>
  );
}
