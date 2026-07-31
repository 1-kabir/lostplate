import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { ScreenTransition } from '../../components/ui/ScreenTransition';
import { CaretLeft } from 'phosphor-react-native';
import { apiService } from '../../lib/api';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUserProfile } = useAuthStore();
  const { showToast } = useToastStore();

  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }
    setLoading(true);
    let coords = { lat: user?.lat ?? null, lng: user?.lng ?? null };
    if (address.trim() && address !== user?.address) {
      try {
        const geo = await apiService.geocode(address);
        coords.lat = geo.lat;
        coords.lng = geo.lng;
      } catch (e) {
        console.warn('Geocoding updated address failed:', e);
      }
    }
    const { error } = await updateUserProfile({ name, address, ...coords } as any);
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Profile updated successfully!', 'success');
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Contact Name"
          placeholderTextColor={colors.neutral400}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={address}
          onChangeText={setAddress}
          placeholder="Address"
          placeholderTextColor={colors.neutral400}
          multiline
          numberOfLines={3}
        />

        <View style={{ marginTop: spacing.s32 }}>
          <Button label={loading ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={loading} />
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
  inputMultiline: {
    height: 100,
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },
});
