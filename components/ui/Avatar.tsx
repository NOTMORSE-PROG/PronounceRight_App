import React from 'react';
import { View, Text, Image } from 'react-native';
import { PROFILE_ICONS } from '@/assets/icons/profile';

interface AvatarProps {
  name: string;
  size?: number;
  iconId?: number;
}

const GRADIENT_PAIRS = [
  ['#2196F3', '#1565C0'],
  ['#00BCD4', '#0097A7'],
  ['#FF9800', '#F57C00'],
  ['#10B981', '#065F46'],
  ['#7C3AED', '#5B21B6'],
];

function getColorPair(name: string): [string, string] {
  const idx = name.charCodeAt(0) % GRADIENT_PAIRS.length;
  return GRADIENT_PAIRS[idx] as [string, string];
}

export default function Avatar({ name, size = 48, iconId }: AvatarProps) {
  const [bg] = getColorPair(name);
  const fontSize = size * 0.36;

  const iconSource = iconId != null ? PROFILE_ICONS[iconId] : undefined;

  if (iconSource) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
        }}
      >
        <Image
          source={iconSource}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    );
  }

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize, fontWeight: '700', letterSpacing: 1 }}>
        {initials}
      </Text>
    </View>
  );
}
