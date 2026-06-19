import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Compass, House, Sparkles, User, Wallet } from 'lucide-react-native';

import { COLORS } from '@/lib/theme';

export default function AppTabsLayout() {
  return (
    <>
      {/* eslint-disable-next-line react/style-prop-object -- expo-status-bar `style` is a string enum, not a RN style object */}
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: COLORS.ink },
          tabBarStyle: {
            backgroundColor: COLORS.inkSoft,
            borderTopWidth: 2,
            borderTopColor: COLORS.black,
            height: 64,
            paddingTop: 6,
          },
          tabBarActiveTintColor: COLORS.lime,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarLabelStyle: {
            fontFamily: 'JetBrainsMono_700Bold',
            fontSize: 9,
            letterSpacing: 0.5,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'HOME',
            tabBarIcon: ({ color, size }) => <House color={color} size={size ?? 22} />,
          }}
        />
        <Tabs.Screen
          name="quests"
          options={{
            title: 'QUESTS',
            tabBarIcon: ({ color, size }) => <Compass color={color} size={size ?? 22} />,
          }}
        />
        <Tabs.Screen
          name="nova"
          options={{
            title: 'NOVA',
            tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size ?? 22} />,
          }}
        />
        <Tabs.Screen
          name="stash"
          options={{
            title: 'STASH',
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size ?? 22} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'PROFILE',
            tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 22} />,
          }}
        />
      </Tabs>
    </>
  );
}
