import React from 'react';
import { View, ViewProps } from 'react-native';

type Elevation = 'flat' | 'sm' | 'md';

interface CardProps extends ViewProps {
  elevation?: Elevation;
  noPadding?: boolean;
}

const elevationClasses: Record<Elevation, string> = {
  flat: 'bg-white rounded-2xl border border-border',
  sm: 'bg-white rounded-2xl border border-border shadow-card',
  md: 'bg-white rounded-2xl shadow-card-md',
};

export default function Card({
  elevation = 'sm',
  noPadding = false,
  children,
  className = '',
  ...rest
}: CardProps) {
  return (
    <View
      className={`${elevationClasses[elevation]} ${noPadding ? '' : 'p-4'} ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
