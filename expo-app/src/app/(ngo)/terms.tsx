import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { colors, typography, spacing } from '../../constants/theme';

export default function NgoTermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft color={colors.neutral900} size={22} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Lost Plate Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last Updated: July 2026</Text>

        <Text style={styles.heading}>1. Agreement to Terms</Text>
        <Text style={styles.body}>
          By accessing or using the Lost Plate application, you agree to comply with and be bound by these Terms of Service.
        </Text>

        <Text style={styles.heading}>2. Safety & Liability Disclaimer</Text>
        <Text style={styles.body}>
          Lost Plate acts solely as a matching and coordination platform. Donors agree to share food fit for human consumption, adhering to local sanitary standards. NGOs agree to transport and distribute food safely. Lost Plate is not liable for issues relating to food quality or safety after handover.
        </Text>

        <Text style={styles.heading}>3. User Obligations</Text>
        <Text style={styles.body}>
          You must provide true and accurate information during onboarding, including licensing or registration credentials. You may not misrepresent food volumes or organizational purposes.
        </Text>

        <Text style={styles.heading}>4. Verification QR Handshake</Text>
        <Text style={styles.body}>
          To confirm successful delivery, users must perform a QR-code handshake. Bypassing verification steps may result in account review or restriction.
        </Text>

        <Text style={styles.heading}>5. Changes to Terms</Text>
        <Text style={styles.body}>
          We may update these terms periodically. Continued use of the platform constitutes acceptance of updated terms.
        </Text>
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
    fontSize: 16,
    color: colors.neutral900,
  },
  content: {
    padding: spacing.screenHorizontal,
    paddingBottom: 40,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: 20,
    color: colors.neutral900,
    marginTop: 12,
    marginBottom: 4,
  },
  lastUpdated: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.neutral400,
    marginBottom: 24,
  },
  heading: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 15,
    color: colors.neutral900,
    marginTop: 16,
    marginBottom: 8,
  },
  body: {
    fontFamily: typography.fonts.regular,
    fontSize: 13,
    color: colors.neutral600,
    lineHeight: 18,
    marginBottom: 16,
  },
});
