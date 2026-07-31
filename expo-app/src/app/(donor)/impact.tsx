import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Modal, Pressable, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { X, ShareNetwork } from 'phosphor-react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService, ImpactStats } from '../../lib/api';

function daysActiveSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)));
}

export default function DonorImpactScreen() {
  const { user } = useAuthStore();
  const [shareVisible, setShareVisible] = useState(false);
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiService
      .getImpact(user.id)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const daysActive = daysActiveSince(stats?.memberSince ?? user?.createdAt ?? null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>FoodPrint</Text>

        {loading ? (
          <ActivityIndicator color={colors.blue400} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.heroSection}>
              <Text style={styles.heroLabel}>Total food rescued</Text>
              <Text style={styles.heroNumber}>
                {stats?.totalKg ?? 0}<Text style={styles.heroUnit}> kg</Text>
              </Text>
            </View>

            <View style={styles.grid}>
              <View style={[styles.gridItem, { flex: 1.4 }]}>
                <Text style={styles.gridLabel}>Meals enabled</Text>
                <Text style={styles.gridValue}>{stats?.mealsEnabled ?? 0}</Text>
              </View>
              <View style={[styles.gridItem, { flex: 1 }]}>
                <Text style={styles.gridLabel}>Days active</Text>
                <Text style={styles.gridValue}>{daysActive}</Text>
              </View>
              <View style={[styles.gridItem, { flex: 1 }]}>
                <Text style={styles.gridLabel}>Partners</Text>
                <Text style={styles.gridValue}>{stats?.partnerCount ?? 0}</Text>
              </View>
            </View>
          </>
        )}

        <View style={{ marginTop: spacing.s40 }}>
          <Button variant="outline" label="Share milestone" onPress={() => setShareVisible(true)} />
        </View>
      </ScrollView>

      {/* Share Milestone graphics card modal */}
      <Modal visible={shareVisible} transparent animationType="slide">
        <View style={styles.modalScrim}>
          <View style={styles.shareCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Milestone</Text>
              <Pressable onPress={() => setShareVisible(false)}>
                <X color={colors.neutral900} size={24} />
              </Pressable>
            </View>

            {/* Simulated milestone design graphic */}
            <View style={styles.milestoneGraphic}>
              <View style={styles.milestoneCircle}>
                <ShareNetwork color={colors.white} size={28} weight="bold" />
              </View>
              <Text style={styles.graphicTitle}>{stats?.totalKg ?? 0} KG RESCUED</Text>
              <Text style={styles.graphicSub}>
                I've rescued {stats?.totalKg ?? 0} kg of surplus food and enabled {stats?.mealsEnabled ?? 0} meals using Lost Plate!
              </Text>
              <View style={styles.graphicLogo}>
                <Text style={styles.graphicLogoText}>Lost Plate</Text>
              </View>
            </View>

            <Button label="Share Image" onPress={() => setShareVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral0,
  },
  content: {
    padding: spacing.screenHorizontal,
    paddingTop: 40,
    paddingBottom: 40,
  },
  pageTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.neutral900,
    marginBottom: spacing.s32,
    letterSpacing: -0.5,
  },
  heroSection: {
    marginBottom: spacing.s40,
  },
  heroLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral600,
    marginBottom: 8,
  },
  heroNumber: {
    fontFamily: typography.fonts.extraBold,
    fontSize: typography.size.xxxl.fontSize,
    color: colors.blue500,
    letterSpacing: -1,
    lineHeight: typography.size.xxxl.lineHeight,
  },
  heroUnit: {
    fontSize: typography.size.xxl.fontSize,
    fontFamily: typography.fonts.semiBold,
    color: colors.blue400,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  gridItem: {
    backgroundColor: colors.blue100,
    padding: 16,
    borderRadius: radius.card,
  },
  gridLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral600,
    marginBottom: 8,
  },
  gridValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.neutral900,
    letterSpacing: -0.5,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(26,43,60,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  shareCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 20,
    gap: 20,
    ...shadows.float,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.md.fontSize,
    color: colors.neutral900,
  },
  milestoneGraphic: {
    backgroundColor: colors.blue500,
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  milestoneCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphicTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.lg.fontSize,
    color: colors.white,
    letterSpacing: 0.5,
  },
  graphicSub: {
    fontFamily: typography.fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 18,
  },
  graphicLogo: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
  },
  graphicLogoText: {
    fontFamily: typography.fonts.bold,
    fontSize: 12,
    color: colors.blue500,
  }
});
