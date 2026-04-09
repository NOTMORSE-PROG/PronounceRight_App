import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const H_MARGIN = 20;
const BAR_WIDTH = SCREEN_W - H_MARGIN * 2;
const BAR_HEIGHT = 60;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { outline: IoniconName; filled: IoniconName }> = {
  dashboard: { outline: 'home-outline', filled: 'home' },
  modules:   { outline: 'book-outline', filled: 'book' },
  badges:    { outline: 'medal-outline', filled: 'medal' },
  profile:   { outline: 'person-outline', filled: 'person' },
};

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Home',
  modules:   'Modules',
  badges:    'Badges',
  profile:   'Profile',
};

interface TabItemProps {
  route: { key: string; name: string };
  isFocused: boolean;
  tabWidth: number;
  navigation: BottomTabBarProps['navigation'];
}

function TabItem({ route, isFocused, tabWidth, navigation }: TabItemProps) {
  const icons = TAB_ICONS[route.name]!;
  const label = TAB_LABELS[route.name] ?? route.name;
  const iconScale = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const onPress = () => {
    iconScale.value = withSpring(1.15, { damping: 10, stiffness: 300 });
    setTimeout(() => {
      iconScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    }, 150);

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: tabWidth,
        height: BAR_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Animated.View style={iconStyle}>
        <Ionicons
          name={isFocused ? icons.filled : icons.outline}
          size={22}
          color={isFocused ? '#2196F3' : '#90A4AE'}
        />
      </Animated.View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '600',
          color: isFocused ? '#2196F3' : '#90A4AE',
          marginTop: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((r) => TAB_ICONS[r.name]);

  const tabCount = visibleRoutes.length;
  const tabWidth = BAR_WIDTH / tabCount;

  const activeVisibleIndex = visibleRoutes.findIndex((r) => r.name === state.routes[state.index]?.name);
  const safeIndex = activeVisibleIndex >= 0 ? activeVisibleIndex : 0;

  const pillX = useSharedValue(safeIndex * tabWidth);
  const prevIndex = useRef(safeIndex);

  useEffect(() => {
    if (prevIndex.current !== safeIndex) {
      pillX.value = withSpring(safeIndex * tabWidth, { damping: 14, stiffness: 160 });
      prevIndex.current = safeIndex;
    }
  }, [safeIndex, tabWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 8,
        left: H_MARGIN,
        right: H_MARGIN,
        height: BAR_HEIGHT,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 16,
        shadowColor: '#2196F3',
        shadowOpacity: 0.20,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
        overflow: 'hidden',
      }}
    >
      {/* Sliding pill indicator */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: tabWidth,
            height: BAR_HEIGHT,
            backgroundColor: '#EBF5FF',
            borderRadius: 28,
          },
          pillStyle,
        ]}
      />

      {visibleRoutes.map((route, index) => (
        <TabItem
          key={route.key}
          route={route}
          isFocused={index === safeIndex}
          tabWidth={tabWidth}
          navigation={navigation}
        />
      ))}
    </View>
  );
}
