import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { CaretLeft, Bell } from 'phosphor-react-native';
import { useClaimStore } from '../../store/claimStore';
import { useAuthStore } from '../../store/authStore';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Real activity feed derived from claims on this donor's listings — no
// separate notifications table needed, and it can never drift out of sync
// with what actually happened.
export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { claims, fetchClaimsOnMyListings } = useClaimStore();

  useEffect(() => {
    fetchClaimsOnMyListings();
  }, []);

  const items = useMemo(() => {
    const entries: { id: string; title: string; message: string; time: string; unread: boolean }[] = [];
    for (const c of claims) {
      entries.push({
        id: `${c.id}-claimed`,
        title: 'Donation Claimed',
        message: `${c.ngoName} claimed ${c.qtyClaimedKg}kg of ${c.foodName}.`,
        time: c.createdAt,
        unread: c.status === 'confirmed',
      });
      if (c.status === 'completed' && c.completedAt) {
        entries.push({
          id: `${c.id}-completed`,
          title: 'Pickup Verified',
          message: `${c.foodName} (${c.qtyClaimedKg}kg) was picked up by ${c.ngoName}.`,
          time: c.completedAt,
          unread: false,
        });
      }
    }
    if (user?.createdAt) {
      entries.push({
        id: 'welcome',
        title: 'Welcome to Lost Plate',
        message: "Thanks for joining! Together we rescue food and feed communities.",
        time: user.createdAt,
        unread: false,
      });
    }
    return entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [claims, user?.createdAt]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft color={colors.neutral900} size={22} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.length === 0 && (
          <Text style={styles.notifMessage}>Nothing yet — activity on your listings will show up here.</Text>
        )}
        {items.map(n => (
          <View key={n.id} style={[styles.notifCard, n.unread && styles.notifCardUnread]}>
            <View style={styles.iconCol}>
              <Bell color={n.unread ? colors.blue500 : colors.neutral400} size={20} weight={n.unread ? 'fill' : 'regular'} />
            </View>
            <View style={styles.textCol}>
              <View style={styles.titleRow}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.notifTime}>{timeAgo(n.time)}</Text>
              </View>
              <Text style={styles.notifMessage}>{n.message}</Text>
            </View>
          </View>
        ))}
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
    fontSize: typography.size.md.fontSize,
    color: colors.neutral900,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: colors.blue50,
    borderColor: colors.blue200,
  },
  iconCol: {
    paddingTop: 2,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 14,
    color: colors.neutral900,
  },
  notifTime: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    color: colors.neutral400,
  },
  notifMessage: {
    fontFamily: typography.fonts.regular,
    fontSize: 13,
    color: colors.neutral600,
    lineHeight: 18,
  },
});
