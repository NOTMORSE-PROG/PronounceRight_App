import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, TextInputProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolateColor,
  interpolate,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  showSecure?: boolean;
  hint?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  autoCorrect?: boolean;
}

const UNFOCUSED_BORDER = 'rgba(187,222,251,0.4)';
const FOCUSED_BORDER = 'rgba(33,150,243,0.8)';
const UNFOCUSED_BG = 'rgba(240,247,255,0.5)';
const FOCUSED_BG = 'rgba(255,255,255,0.95)';

export default function AnimatedInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  onToggleSecure,
  showSecure,
  hint,
  keyboardType,
  autoCapitalize,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  autoCorrect = false,
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
  };

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [UNFOCUSED_BORDER, FOCUSED_BORDER],
    ),
    backgroundColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [UNFOCUSED_BG, FOCUSED_BG],
    ),
    transform: [
      { scale: interpolate(focusProgress.value, [0, 1], [1, 1.01]) },
      { translateX: shakeX.value },
    ],
  }));

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: isFocused ? '#1E88E5' : '#546E7A',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1.5,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 13,
          },
          containerStyle,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={isFocused ? '#2196F3' : '#90A4AE'}
        />
        <TextInput
          ref={inputRef as any}
          style={{
            flex: 1,
            fontSize: 15,
            color: '#1A237E',
            marginLeft: 12,
            padding: 0,
          }}
          placeholder={placeholder}
          placeholderTextColor="rgba(144,164,174,0.7)"
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {onToggleSecure !== undefined && (
          <Pressable onPress={onToggleSecure} hitSlop={8}>
            <Ionicons
              name={showSecure ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={isFocused ? '#2196F3' : '#90A4AE'}
            />
          </Pressable>
        )}
      </Animated.View>
      {hint ? (
        <Text style={{ fontSize: 11, color: 'rgba(144,164,174,0.8)', marginTop: 4, marginLeft: 4 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Trigger a shake animation on an AnimatedInput's shakeX shared value */
export function triggerShake(shakeX: SharedValue<number>) {
  shakeX.value = withSequence(
    withTiming(-8, { duration: 50 }),
    withTiming(8, { duration: 50 }),
    withTiming(-6, { duration: 50 }),
    withTiming(6, { duration: 50 }),
    withTiming(0, { duration: 50 }),
  );
}
