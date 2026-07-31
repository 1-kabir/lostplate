import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { colors, typography, spacing } from '../../constants/theme';

export default function NgoPrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft color={colors.neutral900} size={22} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Lost Plate Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last Updated: July 2026</Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.body}>
          We collect information you provide directly to us when creating an account, publishing listings, or claiming donations, including names, contact details, organizational registration numbers, and location coordinates to facilitate logistics.
        </Text>

        <Text style={styles.heading}>2. How We Use Information</Text>
        <Text style={styles.body}>
          We use the information we collect to match donor listings with nearby NGOs, facilitate pickup verification via secure QR codes, verify organizational status, and compile impact analytics to show food rescue metrics.
        </Text>

        <Text style={styles.heading}>3. Sharing of Information</Text>
        <Text style={styles.body}>
          Information is shared between active donors and NGOs only when matching a claim is confirmed. We do not sell or monetize personal information.
        </Text>

        <Text style={styles.heading}>4. Security</Text>
        <Text style={styles.body}>
          We implement secure data transmission and store credentials safely. Real-time notifications and location mappings are securely restricted to authenticated users.
        </Text>

        <Text style={styles.heading}>5. Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about this policy, please reach out to us at privacy@lostplate.org.
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
