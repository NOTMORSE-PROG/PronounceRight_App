import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, { container: string; text: string; pressed: string }> = {
  primary: {
    container: 'bg-primary-500 rounded-xl shadow-sm',
    text: 'text-white font-semibold',
    pressed: 'bg-primary-600',
  },
  secondary: {
    container: 'bg-primary-50 rounded-xl border border-primary-200',
    text: 'text-primary-700 font-semibold',
    pressed: 'bg-primary-100',
  },
  outline: {
    container: 'bg-transparent rounded-xl border-2 border-primary-500',
    text: 'text-primary-500 font-semibold',
    pressed: 'bg-primary-50',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-primary-500 font-medium',
    pressed: 'bg-primary-50 rounded-xl',
  },
};

const sizeClasses: Record<Size, { container: string; text: string }> = {
  sm: { container: 'py-2 px-4 min-h-[40px]', text: 'text-sm' },
  md: { container: 'py-3 px-5 min-h-[48px]', text: 'text-base' },
  lg: { container: 'py-4 px-6 min-h-[54px]', text: 'text-base' },
};

export default function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const v = variantClasses[variant];
  const s = sizeClasses[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`items-center justify-center ${v.container} ${s.container} ${
        fullWidth ? 'w-full' : ''
      } ${isDisabled ? 'opacity-50' : ''}`}
      style={({ pressed }) => (pressed && !isDisabled ? {} : {})}
      disabled={isDisabled}
      {...rest}
    >
      {({ pressed }) => (
        <Text
          className={`${v.text} ${s.text} ${pressed && !isDisabled ? 'opacity-80' : ''}`}
          numberOfLines={1}
        >
          {loading ? (
            <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#2196F3'} />
          ) : (
            label
          )}
        </Text>
      )}
    </Pressable>
  );
}
