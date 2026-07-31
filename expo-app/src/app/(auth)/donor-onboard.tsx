import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { apiService } from '../../lib/api';

const TOTAL_STEPS = 3;

const ORG_TYPES = ['Individual', 'Restaurant', 'Hotel', 'Caterer', 'Other'];
const FOOD_TYPES = ['Cooked Meals', 'Raw Produce', 'Packaged Goods', 'Beverages', 'Bakery'];

function ProgressLine({ step }: { step: number }) {
  const progress = (step / TOTAL_STEPS) * 100;
  return (
    <View style={progressStyles.track}>
      <Animated.View
        style={[
          progressStyles.fill,
          { width: `${progress}%` },
        ]}
      />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 2,
    backgroundColor: colors.neutral100,
    width: '100%',
  },
  fill: {
    height: 2,
    backgroundColor: colors.blue400,
  },
});

function ChipSelector({
  options,
  selected,
  onToggle,
  multi = false,
}: {
  options: string[];
  selected: string | string[];
  onToggle: (val: string) => void;
  multi?: boolean;
}) {
  const isActive = (val: string) =>
    multi ? (selected as string[]).includes(val) : selected === val;

  return (
    <View style={chipStyles.container}>
      {options.map((opt) => {
        const active = isActive(opt);
        return (
          <Pressable
            key={opt}
            style={[chipStyles.chip, active && chipStyles.chipActive]}
            onPress={() => onToggle(opt)}
          >
            <Text style={[chipStyles.text, active && chipStyles.textActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  chipActive: {
    backgroundColor: colors.blue400,
    borderColor: colors.blue400,
  },
  text: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral600,
  },
  textActive: {
    color: colors.white,
  },
});

export default function DonorOnboardScreen() {
  const { setOnboarded, updateUser, logout } = useAuthStore();
  const { showToast } = useToastStore();
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState(useAuthStore.getState().user?.name || '');
  const [orgType, setOrgType] = useState('Restaurant');

  // Step 2 — geocoded eagerly (to validate the address) but only persisted
  // to Supabase in the final combined write, so a partial exit never leaves
  // half-written profile data behind.
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number; displayName: string } | null>(null);

  // Step 3
  const [foodPrefs, setFoodPrefs] = useState<string[]>(['Cooked Meals']);
  const [loading, setLoading] = useState(false);

  const toggleFoodPref = (val: string) => {
    setFoodPrefs((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      try {
        const result = await apiService.geocode(address);
        setCoords(result);
        setStep(3);
      } catch (err) {
        showToast('Could not verify address location. Try a different search term or nearby landmark.', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      const result = await updateUser({
        name,
        orgType,
        address: coords ? coords.displayName || address : address,
        lat: coords?.lat ?? undefined,
        lng: coords?.lng ?? undefined,
        foodPrefs,
      });
      setLoading(false);

      if (result.error) {
        showToast(`Could not save your profile: ${result.error}`, 'error');
        return;
      }
      await setOnboarded();
    }
  };

  const handleBack = async () => {
    if (step === 1) {
      await logout();
      router.replace('/(auth)');
    } else {
      setStep((s) => s - 1);
    }
  };

  const canProceed =
    step === 1 ? name.trim().length > 0 :
    step === 2 ? address.trim().length > 0 :
    foodPrefs.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ProgressLine step={step} />

      {/* Top-left back / cancel button */}
      <View style={styles.topNav}>
        <Pressable style={styles.topBackBtn} onPress={handleBack}>
          <CaretLeft color={colors.neutral900} size={20} weight="bold" />
          <Text style={styles.topBackLabel}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepIndicator}>
            <Text style={styles.stepCount}>Step {step} of {TOTAL_STEPS}</Text>
          </View>

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>What's the name of your business?</Text>
              <Text style={styles.subtitle}>This is how NGOs will see you on the platform.</Text>

              <View style={styles.fieldGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Local Cafe"
                  placeholderTextColor={colors.neutral400}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>

              <Text style={styles.fieldLabel}>Organisation type</Text>
              <ChipSelector
                options={ORG_TYPES}
                selected={orgType}
                onToggle={setOrgType}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>Where are you located?</Text>
              <Text style={styles.subtitle}>NGOs will use this to find food near them.</Text>

              <View style={styles.fieldGroup}>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Enter your address"
                  placeholderTextColor={colors.neutral400}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>What do you usually have available?</Text>
              <Text style={styles.subtitle}>Select all that apply — you can change this later.</Text>

              <View style={{ marginTop: 8 }}>
                <ChipSelector
                  options={FOOD_TYPES}
                  selected={foodPrefs}
                  onToggle={toggleFoodPref}
                  multi
                />
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <View style={step > 1 ? styles.nextBtnPartial : styles.nextBtnFull}>
              <Button
                label={loading ? 'Verifying...' : step === TOTAL_STEPS ? 'Complete Setup' : 'Continue'}
                onPress={handleNext}
                disabled={!canProceed || loading}
              />
            </View>
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
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginLeft: -8,
  },
  topBackLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral900,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 32,
    paddingBottom: 40,
  },
  stepIndicator: {
    marginBottom: 24,
  },
  stepCount: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral400,
  },
  stepContent: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.neutral900,
    lineHeight: typography.size.xl.lineHeight,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral400,
    marginBottom: 32,
    lineHeight: 22,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral900,
    marginBottom: 12,
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
  inputMultiline: {
    height: 100,
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 40,
    alignItems: 'center',
  },
  backBtn: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.neutral200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral600,
  },
  nextBtnFull: {
    flex: 1,
  },
  nextBtnPartial: {
    flex: 1,
  },
});
