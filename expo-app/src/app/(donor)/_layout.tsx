import { Tabs } from 'expo-router';
import { House, ListDashes, ChartBar, Gear } from 'phosphor-react-native';
import { colors, typography } from '../../constants/theme';

export default function DonorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.neutral100,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.blue400,
        tabBarInactiveTintColor: colors.neutral400,
        tabBarLabelStyle: {
          fontFamily: typography.fonts.medium,
          fontSize: 11,
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <House color={color as string} size={24} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: 'Listings',
          tabBarIcon: ({ color }) => (
            <ListDashes color={color as string} size={24} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="impact"
        options={{
          title: 'Impact',
          tabBarIcon: ({ color }) => (
            <ChartBar color={color as string} size={24} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => (
            <Gear color={color as string} size={24} weight="regular" />
          ),
        }}
      />
      {/* Hidden — navigable but not in tab bar */}
      <Tabs.Screen name="map" options={{ href: null }} />
      <Tabs.Screen name="donations" options={{ href: null }} />
      <Tabs.Screen name="list-food" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="org-details" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
    </Tabs>
  );
}
