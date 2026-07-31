import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';


type UserType = 'donor' | 'ngo';
type AuthMode = 'login' | 'signup';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TypeToggleButton({
  label,
  sublabel,
  isActive,
  onPress,
}: {
  label: string;
  sublabel: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const pressed = useSharedValue(0);
  const active = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    active.value = withSpring(isActive ? 1 : 0, { stiffness: 320, damping: 26 });
  }, [isActive]);

  const handlePressIn = () => {
    pressed.value = withSpring(1, { stiffness: 420, damping: 15 });
  };
  const handlePressOut = () => {
    pressed.value = withSpring(0, { stiffness: 420, damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.97]) }],
    backgroundColor: isActive ? colors.blue400 : colors.neutral50,
    borderColor: isActive ? colors.blue400 : colors.neutral100,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.typeBtn, animatedStyle]}
    >
      <Text style={[styles.typeBtnLabel, isActive && styles.typeBtnLabelActive]}>{label}</Text>
      <Text style={[styles.typeBtnSublabel, isActive && styles.typeBtnSublabelActive]}>{sublabel}</Text>
    </AnimatedPressable>
  );
}

export default function LoginScreen() {
  const [selectedType, setSelectedType] = useState<UserType>('donor');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuthStore();
  const router = useRouter();

  const isSignup = authMode === 'signup';

  const { showToast } = useToastStore();

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !password) {
      showToast('Enter both an email and a password to continue.', 'error');
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (isSignup && !name.trim()) {
      showToast(selectedType === 'donor' ? 'Enter your business name.' : 'Enter your organisation name.', 'error');
      return;
    }

    setSubmitting(true);
    const result = isSignup
      ? await signUp({ email: trimmedEmail, password, type: selectedType, name: name.trim() })
      : await signIn({ email: trimmedEmail, password });
    setSubmitting(false);

    if (result.error) {
      showToast(result.error, 'error');
    } else if (result.needsEmailVerification) {
      // Supabase requires email confirmation — go to the pending screen
      router.replace('/(auth)/verify-email' as any);
    } else if (isSignup) {
      showToast('Account created! Let\'s set up your profile.', 'success');
    } else {
      showToast('Welcome back to Lost Plate!', 'success');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={styles.brandingSection}>
            <Image
              source={require('../../../assets/images/logo1.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Turn surplus into impact.</Text>
          </View>

          {/* I am a... */}
          <Text style={styles.sectionLabel}>I am a</Text>
          <View style={styles.typeRow}>
            <TypeToggleButton
              label="Donor"
              sublabel="Restaurant, hotel, household"
              isActive={selectedType === 'donor'}
              onPress={() => setSelectedType('donor')}
            />
            <TypeToggleButton
              label="NGO"
              sublabel="Verified relief organisation"
              isActive={selectedType === 'ngo'}
              onPress={() => setSelectedType('ngo')}
            />
          </View>

          {/* Auth mode tabs */}
          <View style={styles.modeSwitcher}>
            <Pressable
              style={[styles.modeTab, authMode === 'login' && styles.modeTabActive]}
              onPress={() => setAuthMode('login')}
            >
              <Text style={[styles.modeTabText, authMode === 'login' && styles.modeTabTextActive]}>
                Log In
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, authMode === 'signup' && styles.modeTabActive]}
              onPress={() => setAuthMode('signup')}
            >
              <Text style={[styles.modeTabText, authMode === 'signup' && styles.modeTabTextActive]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignup && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {selectedType === 'donor' ? 'Business / Name' : 'Organisation Name'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={selectedType === 'donor' ? 'e.g. Local Cafe' : 'e.g. Hope Foundation'}
                  placeholderTextColor={colors.neutral400}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.neutral400}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.neutral400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={{ marginTop: spacing.s24 }}>
              <Button
                label={submitting ? 'Please wait…' : isSignup ? 'Create Account' : 'Continue'}
                onPress={handleSubmit}
                disabled={submitting}
              />
            </View>

            {/* Removed forgot password buttons */}
          </View>

          {/* Bottom switch */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <Pressable onPress={() => setAuthMode(isSignup ? 'login' : 'signup')}>
              <Text style={styles.switchLink}>{isSignup ? 'Log in' : 'Sign up'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral0,
  },
  scroll: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 40,
    paddingBottom: 40,
  },

  // Branding
  brandingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 220,
    height: 88,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral400,
  },

  // Type selector
  sectionLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral900,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  typeBtnLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.md.fontSize,
    color: colors.neutral600,
    marginBottom: 3,
  },
  typeBtnLabelActive: {
    color: colors.white,
  },
  typeBtnSublabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral400,
    lineHeight: 16,
  },
  typeBtnSublabelActive: {
    color: 'rgba(255,255,255,0.75)',
  },

  // Login / Sign Up mode tabs
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.neutral100,
    borderRadius: radius.card,
    padding: 4,
    marginBottom: 28,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.white,
  },
  modeTabText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral400,
  },
  modeTabTextActive: {
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral900,
  },

  // Form
  form: {
    gap: 0,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral900,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius.input,
    height: 56,
    paddingHorizontal: 16,
    fontFamily: typography.fonts.regular,
    fontSize: 15,
    color: colors.neutral900,
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.blue500,
  },

  // Bottom switch
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  switchText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral600,
  },
  switchLink: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.sm.fontSize,
    color: colors.blue500,
  },
});
