import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useListingStore } from '../../store/listingStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { StatusPill } from '../../components/ui/Badge';
import type { Listing } from '../../store/listingStore';
import { apiService, ImpactStats } from '../../lib/api';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function MiniListingRow({ listing }: { listing: Listing }) {
  const urgencyColor =
    listing.urgency === 'red'
      ? colors.red
      : listing.urgency === 'amber'
      ? colors.amber
      : colors.green;

  return (
    <View style={rowStyles.card}>
      <View style={[rowStyles.urgencyBar, { backgroundColor: urgencyColor }]} />
      <View style={rowStyles.inner}>
        <View style={rowStyles.left}>
          <Text style={rowStyles.foodName} numberOfLines={1}>
            {listing.foodName}
          </Text>
          <Text style={rowStyles.meta}>{listing.timeRemaining}</Text>
        </View>
        <View style={rowStyles.right}>
          <Text style={rowStyles.qty}>
            {listing.qty}
            <Text style={rowStyles.qtyUnit}> kg</Text>
          </Text>
          <StatusPill status={listing.status} />
        </View>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  urgencyBar: {
    width: 3,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  foodName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.md.fontSize,
    color: colors.neutral900,
  },
  meta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral400,
  },
  qty: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.blue500,
    letterSpacing: -0.5,
  },
  qtyUnit: {
    fontSize: typography.size.sm.fontSize,
    fontFamily: typography.fonts.medium,
    color: colors.blue400,
    letterSpacing: 0,
  },
});

export default function DonorDashboard() {
  const { user } = useAuthStore();
  const { listings, fetchListings, subscribeRealtime, unsubscribeRealtime } = useListingStore();
  const router = useRouter();
  const [stats, setStats] = useState<ImpactStats | null>(null);

  useEffect(() => {
    fetchListings();
    subscribeRealtime();
    if (user?.id) {
      apiService.getImpact(user.id).then(setStats).catch(() => {});
    }
    return () => unsubscribeRealtime();
  }, [user?.id]);

  const myAllListings = listings.filter((l) => l.donorId === user?.id);
  const myListings = myAllListings.filter((l) => l.status !== 'expired').slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>

        {/* Stat strip — showing same metrics as impact screen */}
        <View style={styles.statStrip}>
          <View style={[styles.statBox, { flex: 2.2 }]}>
            <Text style={styles.statLabel}>Total rescued</Text>
            <Text style={styles.statValue}>{stats?.totalKg ?? 0} kg</Text>
          </View>
          <View style={[styles.statBox, { flex: 1.4 }]}>
            <Text style={styles.statLabel}>Meals enabled</Text>
            <Text style={styles.statValue}>{stats?.mealsEnabled ?? 0}</Text>
          </View>
          <View style={[styles.statBox, { flex: 1.4 }]}>
            <Text style={styles.statLabel}>Partners</Text>
            <Text style={styles.statValue}>{stats?.partnerCount ?? 0}</Text>
          </View>
        </View>

        {/* Active listings — vertical rows */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Listings</Text>
        </View>

        {myListings.length > 0 ? (
          <View style={styles.listingRows}>
            {myListings.map((listing) => (
              <MiniListingRow key={listing.id} listing={listing} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active listings yet.</Text>
          </View>
        )}

        <Pressable
          style={styles.viewAllBtn}
          onPress={() => router.push('/(donor)/listings')}
        >
          <Text style={styles.viewAllText}>View all listings</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral0,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Header — subdued per guidelines: text-lg, weight 500, neutral-600
  header: {
    marginBottom: spacing.s24,
  },
  greeting: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.lg.fontSize,
    color: colors.neutral600,
    lineHeight: typography.size.lg.lineHeight,
  },
  name: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.lg.fontSize,
    color: colors.neutral900,
    lineHeight: typography.size.lg.lineHeight,
  },

  // Stat strip — blue-100 fill, no border, no shadow per guidelines
  statStrip: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.s32,
  },
  statBox: {
    backgroundColor: colors.blue100,
    borderRadius: radius.card,
    padding: 14,
  },
  statLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral600,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.neutral900,
    letterSpacing: -0.5,
  },

  // Section
  sectionHeader: {
    marginBottom: spacing.s16,
  },
  sectionTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.md.fontSize,
    color: colors.neutral900,
  },
  listingRows: {
    gap: 10,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral400,
  },

  // View all — text-only link at bottom
  viewAllBtn: {
    marginTop: spacing.s20,
    paddingVertical: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.sm.fontSize,
    color: colors.blue500,
  },
});
