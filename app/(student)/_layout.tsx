import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconFilled: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'dashboard', title: 'Home',    icon: 'home-outline',   iconFilled: 'home' },
  { name: 'modules',   title: 'Modules', icon: 'book-outline',   iconFilled: 'book' },
  { name: 'badges',    title: 'Badges',  icon: 'medal-outline',  iconFilled: 'medal' },
  { name: 'profile',   title: 'Profile', icon: 'person-outline', iconFilled: 'person' },
];

export default function StudentLayout() {
  const insets = useSafeAreaInsets();
  const TAB_CONTENT_HEIGHT = 56;
  const tabBarHeight = TAB_CONTENT_HEIGHT + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#BBDEFB',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#2196F3',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#90A4AE',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFilled : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
      {/* Hide nested routes from tab bar */}
      <Tabs.Screen name="module" options={{ href: null }} />
    </Tabs>
  );
}
