import { Stack } from 'expo-router';

// Auth screens use a Stack so that donor-onboard, ngo-onboard, verify, etc.
// can be pushed/replaced cleanly with a consistent fade transition.
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 180,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    />
  );
}
