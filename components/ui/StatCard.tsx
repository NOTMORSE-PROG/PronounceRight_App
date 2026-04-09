import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  accentColor?: string;
}

export default function StatCard({ icon, value, label, accentColor = '#2196F3' }: StatCardProps) {
  const isNumeric = typeof value === 'number';
  const [displayValue, setDisplayValue] = useState<string | number>(isNumeric ? 0 : value);

  useEffect(() => {
    if (!isNumeric) {
      setDisplayValue(value);
      return;
    }
    const target = value as number;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 800;
    const startTime = performance.now();
    let frameId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress); // ease out quad
      setDisplayValue(Math.round(eased * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View className="bg-white rounded-xl p-3 border border-border flex-1 items-center justify-center">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text style={{ color: accentColor }} className="text-xl font-bold">
        {displayValue}
      </Text>
      <Text className="text-xs text-text-muted text-center mt-0.5" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
