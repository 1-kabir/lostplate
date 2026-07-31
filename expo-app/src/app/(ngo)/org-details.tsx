import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { ScreenTransition } from '../../components/ui/ScreenTransition';
import { CaretLeft } from 'phosphor-react-native';

export default function OrgDetailsScreen() {
  const router = useRouter();
  const { user, updateUserProfile } = useAuthStore();
  const { showToast } = useToastStore();

  const [regNumber, setRegNumber] = useState(user?.registrationNumber || '');
  const [maxCapacity, setMaxCapacity] = useState(user?.maxCapacityKg?.toString() || '50');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const capacityVal = parseInt(maxCapacity);
    if (isNaN(capacityVal) || capacityVal <= 0) {
      showToast('Please enter a valid capacity in kg.', 'error');
      return;
    }
    setLoading(true);
    const { error } = await updateUserProfile({
      registrationNumber: regNumber,
      maxCapacityKg: capacityVal
    });
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Organisation details updated!', 'success');
      router.back();
    }
  };

  return (
    <ScreenTransition>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft color={colors.neutral900} size={22} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Organisation Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Registration Number</Text>
        <TextInput
          style={styles.input}
          value={regNumber}
          onChangeText={setRegNumber}
          placeholder="e.g. FCRA/2024/12345"
          placeholderTextColor={colors.neutral400}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Max Daily Capacity (kg)</Text>
        <TextInput
          style={styles.input}
          value={maxCapacity}
          onChangeText={setMaxCapacity}
          placeholder="e.g. 100"
          placeholderTextColor={colors.neutral400}
          keyboardType="numeric"
        />

        <View style={{ marginTop: spacing.s32 }}>
          <Button label={loading ? 'Saving...' : 'Save Details'} onPress={handleSave} disabled={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.md.fontSize,
    color: colors.neutral900,
  },
  content: {
    padding: spacing.screenHorizontal,
    paddingTop: 24,
  },
  label: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral900,
    marginBottom: 8,
    marginTop: 16,
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
});
