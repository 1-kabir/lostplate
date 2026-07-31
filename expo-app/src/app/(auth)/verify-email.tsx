import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { EnvelopeSimple, ArrowClockwise, SignOut } from 'phosphor-react-native';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { session, logout, resendConfirmationEmail } = useAuthStore();
  const { showToast } = useToastStore();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const email = session?.user?.email ?? 'your email address';

  const handleResend = async () => {
    if (cooldown) {
      showToast('Please wait before requesting another email.', 'info');
      return;
    }
    setResending(true);
    const { error } = await resendConfirmationEmail();
    setResending(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Verification email sent! Check your inbox.', 'success');
      setCooldown(true);
      // 60-second cooldown before they can resend again
      setTimeout(() => setCooldown(false), 60_000);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <EnvelopeSimple color={colors.blue400} size={52} weight="duotone" />
        </View>

        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.subtitle}>
          We sent a verification link to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <Text style={styles.instructions}>
          Open the link in that email to verify your account and continue.
          {'\n\n'}
          On your phone, tapping the link will open Lost Plate directly.
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Resend button */}
        <Pressable
          style={[styles.resendBtn, (resending || cooldown) && styles.btnDisabled]}
          onPress={handleResend}
          disabled={resending || cooldown}
        >
          <ArrowClockwise color={resending || cooldown ? colors.neutral400 : colors.blue500} size={18} weight="bold" />
          <Text style={[styles.resendBtnText, (resending || cooldown) && styles.textDisabled]}>
            {resending ? 'Sending…' : cooldown ? 'Email sent — check inbox' : 'Resend verification email'}
          </Text>
        </Pressable>

        {/* Sign out link */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <SignOut color={colors.neutral400} size={15} weight="regular" />
          <Text style={styles.signOutText}>Use a different account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 48,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: 26,
    color: colors.neutral900,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  email: {
    fontFamily: typography.fonts.semiBold,
    color: colors.blue500,
  },
  instructions: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral400,
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.neutral100,
    marginVertical: 32,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radius.button,
    backgroundColor: colors.blue50,
    borderWidth: 1,
    borderColor: colors.blue200,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: colors.neutral50,
    borderColor: colors.neutral200,
  },
  resendBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.sm.fontSize,
    color: colors.blue500,
  },
  textDisabled: {
    color: colors.neutral400,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signOutText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral400,
  },
});
