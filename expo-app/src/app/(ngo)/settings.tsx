import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import {
  CaretLeft,
  CaretRight,
  SignOut,
  Bell,
  Lock,
  FileText,
  UserCircle,
  Buildings,
} from 'phosphor-react-native';

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  destructive = false,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  destructive?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.rowIconWrap}>
        {icon}
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
          {label}
        </Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {right ?? <CaretRight color={colors.neutral400} size={16} weight="bold" />}
    </Pressable>
  );
}

export default function NGOSettingsScreen() {
  const router = useRouter();
  const { user, session, logout } = useAuthStore();
  const [notifications, setNotifications] = React.useState(true);

  // `user.verified` tracks NGO admin approval (kept in sync with
  // verification_status), not email confirmation — those are two different
  // things. The actual "did they click the confirmation link" answer lives
  // on the auth session itself.
  const emailConfirmed = !!session?.user?.email_confirmed_at;

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft color={colors.neutral900} size={22} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.verifyBadgeRow}>
              <View style={[styles.verifyStatusIndicator, { backgroundColor: emailConfirmed ? colors.green : colors.amber }]} />
              <Text style={[styles.verifyStatusText, { color: emailConfirmed ? colors.green : colors.amber }]}>
                {emailConfirmed ? 'Email Verified ✓' : 'Email Pending Verification'}
              </Text>
            </View>
            {!emailConfirmed && (
              <Pressable 
                onPress={async () => {
                  const { error } = await useAuthStore.getState().resendConfirmationEmail();
                  if (error) {
                    useToastStore.getState().showToast(error, 'error');
                  } else {
                    useToastStore.getState().showToast('Verification email resent successfully!', 'success');
                  }
                }}
                style={styles.resendBtn}
              >
                <Text style={styles.resendBtnText}>Resend email</Text>
              </Pressable>
            )}
          </View>
          <View style={[styles.typeBadge, { backgroundColor: colors.verified + '18' }]}>
            <Text style={[styles.typeBadgeText, { color: colors.verified }]}>NGO</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Organisation</Text>
        <View style={styles.section}>
          <SettingsRow
            icon={<UserCircle color={colors.blue400} size={20} weight="regular" />}
            label="Edit Profile"
            sublabel="Contact info and address"
            onPress={() => router.push('/(ngo)/edit-profile' as any)}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon={<Buildings color={colors.blue400} size={20} weight="regular" />}
            label="Organisation Details"
            sublabel="Registration, capacity, food preferences"
            onPress={() => router.push('/(ngo)/org-details' as any)}
          />
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.section}>
          <SettingsRow
            icon={<Bell color={colors.blue400} size={20} weight="regular" />}
            label="Notification History"
            sublabel="View past updates and alerts"
            onPress={() => router.push('/(ngo)/notifications')}
          />
        </View>

        <Text style={styles.sectionLabel}>Legal</Text>
        <View style={styles.section}>
          <SettingsRow
            icon={<Lock color={colors.neutral600} size={20} weight="regular" />}
            label="Privacy Policy"
            onPress={() => router.push('/(ngo)/privacy' as any)}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon={<FileText color={colors.neutral600} size={20} weight="regular" />}
            label="Terms of Service"
            onPress={() => router.push('/(ngo)/terms' as any)}
          />
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon={<SignOut color={colors.red} size={20} weight="regular" />}
            label="Log Out"
            onPress={handleLogout}
            destructive
            right={null}
          />
        </View>

        <Text style={styles.version}>Lost Plate v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.md.fontSize,
    color: colors.neutral900,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 24,
    paddingBottom: 48,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    padding: 16,
    marginBottom: 32,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.verified + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.lg.fontSize,
    color: colors.verified,
  },
  profileName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral900,
    marginBottom: 2,
  },
  profileEmail: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral400,
    marginBottom: 4,
  },
  verifyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  verifyStatusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  verifyStatusText: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
  },
  resendBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resendBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 10,
    color: colors.blue600,
  },
  typeBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  typeBadgeText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral400,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  section: {
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    overflow: 'hidden',
    marginBottom: 24,
  },
  divider: { height: 1, backgroundColor: colors.neutral100, marginLeft: 54 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowPressed: { backgroundColor: colors.neutral100 },
  rowIconWrap: {
    width: 20,
    alignItems: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral900,
  },
  rowLabelDestructive: { color: colors.red },
  rowSublabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral400,
    marginTop: 1,
  },
  version: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral200,
    textAlign: 'center',
    marginTop: 8,
  },
});
