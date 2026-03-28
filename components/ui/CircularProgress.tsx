import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  progress: number;   // 0–100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
}

export default function CircularProgress({
  progress,
  size = 56,
  strokeWidth = 6,
  color = '#2196F3',
  trackColor = '#BBDEFB',
  showLabel = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      {showLabel && (
        <Text style={{ fontSize: size * 0.22, fontWeight: '700', color }}>
          {Math.round(progress)}%
        </Text>
      )}
    </View>
  );
}
