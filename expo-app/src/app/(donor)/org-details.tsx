import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { ScreenTransition } from '../../components/ui/ScreenTransition';
import { CaretLeft } from 'phosphor-react-native';

const CATEGORIES = ['Restaurant', 'Hotel', 'Caterer', 'Household', 'Other'];

export default function OrgDetailsScreen() {
  const router = useRouter();
  const { user, updateUserProfile } = useAuthStore();
  const { showToast } = useToastStore();

  const [orgType, setOrgType] = useState(user?.orgType || 'Restaurant');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await updateUserProfile({ orgType });
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
        <Text style={styles.label}>Organisation Type</Text>
        <View style={styles.chipsContainer}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat}
              style={[styles.chip, orgType === cat && styles.chipActive]}
              onPress={() => setOrgType(cat)}
            >
              <Text style={[styles.chipText, orgType === cat && styles.chipTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </View>

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
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  chipText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral600,
  },
  chipTextActive: {
    color: colors.white,
  },
});
