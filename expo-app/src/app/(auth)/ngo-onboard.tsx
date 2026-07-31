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
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, CaretLeft } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { apiService } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, typography, spacing, radius } from '../../constants/theme';

const TOTAL_STEPS = 3;
const DIET_PREFS = ['Vegetarian', 'Non-Vegetarian', 'Both'];
// Mirrors the categories a donor can list under (see list-food.tsx CATEGORIES)
// — this is what server/routes/match.js compares against a listing's
// category when scoring preference match for the Smart Match engine.
const FOOD_CATEGORIES = ['Cooked Meals', 'Raw Produce', 'Packaged Goods', 'Beverages', 'Bakery'];

function ProgressLine({ step }: { step: number }) {
  const progress = (step / TOTAL_STEPS) * 100;
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${progress}%` }]} />
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
  onSelect,
  onToggle,
  multi = false,
}: {
  options: string[];
  selected: string | string[];
  onSelect?: (val: string) => void;
  onToggle?: (val: string) => void;
  multi?: boolean;
}) {
  const isActive = (val: string) => (multi ? (selected as string[]).includes(val) : selected === val);

  return (
    <View style={chipStyles.container}>
      {options.map((opt) => {
        const active = isActive(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => (multi ? onToggle?.(opt) : onSelect?.(opt))}
            style={[chipStyles.chip, active && chipStyles.chipActive]}
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

function CapacitySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const steps = [10, 25, 50, 100, 150, 200];
  return (
    <View>
      <View style={sliderStyles.row}>
        {steps.map((s) => (
          <Pressable
            key={s}
            style={[sliderStyles.step, value === s && sliderStyles.stepActive]}
            onPress={() => onChange(s)}
          >
            <Text style={[sliderStyles.stepText, value === s && sliderStyles.stepTextActive]}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={sliderStyles.unit}>kg / day</Text>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  step: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral200,
    minWidth: 52,
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: colors.blue400,
    borderColor: colors.blue400,
  },
  stepText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral600,
  },
  stepTextActive: {
    color: colors.white,
  },
  unit: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral400,
    marginTop: 10,
  },
});

export default function NGOOnboardScreen() {
  const { setOnboarded, updateUser, logout } = useAuthStore();
  const { showToast } = useToastStore();
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [orgName, setOrgName] = useState(useAuthStore.getState().user?.name || '');
  const [regNumber, setRegNumber] = useState('');

  // Step 2 — geocoded eagerly to validate the address, persisted only in the
  // final combined write.
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number; displayName: string } | null>(null);

  // Step 3 — dietPref is a display-only constraint; foodPrefs (categories)
  // is what server/routes/match.js actually scores against a listing's
  // category, so it has to be collected here or Smart Match preference
  // scoring silently does nothing for every NGO.
  const [dietPref, setDietPref] = useState('Both');
  const [foodPrefs, setFoodPrefs] = useState<string[]>(['Cooked Meals', 'Raw Produce', 'Packaged Goods', 'Bakery']);
  const [capacity, setCapacity] = useState(50);
  const [loading, setLoading] = useState(false);

  const toggleFoodPref = (val: string) => {
    setFoodPrefs((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
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
        name: orgName,
        registrationNumber: regNumber,
        address: coords ? coords.displayName || address : address,
        lat: coords?.lat ?? undefined,
        lng: coords?.lng ?? undefined,
        dietPref,
        foodPrefs,
        maxCapacityKg: capacity,
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
    step === 1 ? orgName.trim().length > 0 :
    step === 2 ? address.trim().length > 0 :
    true;

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
              <Text style={styles.title}>Tell us about your organisation.</Text>
              <Text style={styles.subtitle}>
                Your registration number will be verified before your account goes live.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Organisation Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Hope Foundation"
                  placeholderTextColor={colors.neutral400}
                  value={orgName}
                  onChangeText={setOrgName}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Registration Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. FCRA/2024/12345"
                  placeholderTextColor={colors.neutral400}
                  value={regNumber}
                  onChangeText={setRegNumber}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.verifyNote}>
                <ShieldCheck color={colors.verified} size={16} weight="fill" />
                <Text style={styles.verifyNoteText}>
                  Your account will show as "Pending Verification" until reviewed.
                </Text>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>Where is your organisation based?</Text>
              <Text style={styles.subtitle}>
                Donors nearby will be prioritised in your feed.
              </Text>

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
              <Text style={styles.title}>What can your organisation accept?</Text>
              <Text style={styles.subtitle}>
                This helps match you with the right donors automatically.
              </Text>

              <Text style={styles.fieldLabel}>Dietary Preference</Text>
              <View style={{ marginBottom: 28 }}>
                <ChipSelector
                  options={DIET_PREFS}
                  selected={dietPref}
                  onSelect={setDietPref}
                />
              </View>

              <Text style={styles.fieldLabel}>Food Categories You Can Accept</Text>
              <Text style={styles.subtitle}>Used to match you with the right donors automatically.</Text>
              <View style={{ marginBottom: 28, marginTop: -16 }}>
                <ChipSelector
                  options={FOOD_CATEGORIES}
                  selected={foodPrefs}
                  onToggle={toggleFoodPref}
                  multi
                />
              </View>

              <Text style={styles.fieldLabel}>Daily Capacity</Text>
              <CapacitySlider value={capacity} onChange={setCapacity} />
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
    marginBottom: 20,
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
  verifyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.verified + '12',
    borderRadius: radius.card,
    padding: 12,
    marginTop: 4,
  },
  verifyNoteText: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.verified,
    lineHeight: 18,
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
