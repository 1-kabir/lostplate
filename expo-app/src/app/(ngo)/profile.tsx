import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { CaretLeft, SignOut, UserCircle } from 'phosphor-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft color={colors.neutral900} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <UserCircle color={colors.blue400} size={64} weight="duotone" />
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user?.type.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.menu}>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </Pressable>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuItemText}>Notification Settings</Text>
          </Pressable>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <SignOut color={colors.red} size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.md.fontSize,
    color: colors.neutral900,
  },
  content: {
    padding: spacing.screenHorizontal,
    paddingTop: 24,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral100,
    marginBottom: spacing.s32,
  },
  avatar: {
    marginBottom: 16,
  },
  name: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.neutral900,
    marginBottom: 4,
  },
  email: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral600,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: colors.blue50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 12,
    color: colors.blue600,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.lg.fontSize,
    color: colors.neutral900,
    marginBottom: spacing.s16,
  },
  menu: {
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    marginBottom: spacing.s32,
    overflow: 'hidden',
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  menuItemText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral900,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.red + '10',
    borderWidth: 1,
    borderColor: colors.red + '30',
  },
  logoutText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.base.fontSize,
    color: colors.red,
  }
});
