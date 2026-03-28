import React from 'react';
import { View, Text, ViewProps } from 'react-native';

type ChipVariant = 'primary' | 'accent' | 'success' | 'warning' | 'muted';

interface ChipProps extends ViewProps {
  label: string;
  variant?: ChipVariant;
  size?: 'sm' | 'md';
}

const variantClasses: Record<ChipVariant, { container: string; text: string }> = {
  primary: { container: 'bg-primary-50', text: 'text-primary-700' },
  accent:  { container: 'bg-accent-50',  text: 'text-accent-600' },
  success: { container: 'bg-success-light', text: 'text-success-dark' },
  warning: { container: 'bg-warning-light', text: 'text-yellow-700' },
  muted:   { container: 'bg-gray-100', text: 'text-gray-600' },
};

export default function Chip({ label, variant = 'primary', size = 'sm', className = '', ...rest }: ChipProps) {
  const v = variantClasses[variant];
  const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <View className={`${v.container} ${padding} rounded-full self-start ${className}`} {...rest}>
      <Text className={`${v.text} ${textSize} font-semibold`}>{label}</Text>
    </View>
  );
}
