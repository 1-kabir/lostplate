import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, TextInput, ScrollView, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useListingStore } from '../../store/listingStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { api } from '../../lib/api';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { CaretLeft, MapPin } from 'phosphor-react-native';

const showAlert = (title: string, message: string, callback?: () => void) => {
  if (Platform.OS === 'web') {
    alert(`${title}: ${message}`);
    if (callback) callback();
  } else {
    Alert.alert(title, message, callback ? [{ text: 'OK', onPress: callback }] : undefined);
  }
};

// "16:30" -> today at 16:30 local time, as ISO. Rolls to tomorrow if that
// time has already passed today.
function timeStringToIso(time: string): string {
  const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(hours || 0, minutes || 0, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function formatWindowTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ClaimSheetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const { listings, fetchListings, claimListing } = useListingStore();
  const [claimQty, setClaimQty] = useState(1);
  const [pickupTime, setPickupTime] = useState('16:30');
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(listings.length > 0);

  const listing = listings.find((l) => l.id === id);

  useEffect(() => {
    if (listings.length === 0) {
      fetchListings().then(() => setInitialized(true));
    }
  }, []);

  useEffect(() => {
    if (listing) setClaimQty(Math.min(listing.qty, Math.max(1, claimQty)));
  }, [listing?.qty]);

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <CaretLeft color={colors.neutral900} size={24} weight="bold" />
          </Pressable>
          <Text style={styles.headerTitle}>Claim Food</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {!initialized ? (
            <ActivityIndicator color={colors.blue400} />
          ) : (
            <Text style={{ fontFamily: typography.fonts.medium, color: colors.neutral400 }}>
              This listing is no longer available.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const handleOpenMaps = () => {
    const url = listing.lat && listing.lng
      ? `https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.donorAddress)}`;
    Linking.openURL(url).catch(() => {
      showToast('There was an issue opening Google Maps.', 'error');
    });
  };

  const handleClaim = async () => {
    setSubmitting(true);
    const result = await claimListing(listing.id, claimQty, timeStringToIso(pickupTime));
    setSubmitting(false);

    if (result.error) {
      showToast(result.error, 'error');
      return;
    }

    // Best-effort — the claim itself already succeeded, so a failed push
    // notification shouldn't surface as an error to the NGO.
    api.post('/api/notify/send', {
      userId: listing.donorId,
      title: 'Your donation was claimed',
      body: `${user?.name ?? 'An NGO'} claimed ${claimQty}kg of ${listing.foodName}.`,
      data: { type: 'claim_confirmed', listingId: listing.id },
    }).catch(() => {});

    showToast(`Claim confirmed! Reserved ${claimQty}kg of ${listing.foodName}.`, 'success');
    router.back();
  };

  const incrementQty = () => {
    if (claimQty < listing.qty) setClaimQty(claimQty + 1);
  };

  const decrementQty = () => {
    if (claimQty > 1) setClaimQty(claimQty - 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft color={colors.neutral900} size={24} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Claim Food</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.foodName}>{listing.foodName}</Text>
            <Text style={styles.donorName}>from {listing.donorName}</Text>
            <Text style={styles.qtyAvailable}>{listing.qty} kg available</Text>
            {listing.donorAddress ? (
              <View style={styles.addressRow}>
                <MapPin size={14} color={colors.neutral400} />
                <Text style={styles.addressText} numberOfLines={2}>
                  {listing.donorAddress}
                </Text>
              </View>
            ) : null}
          </View>
          {listing.donorAddress ? (
            <Pressable style={styles.mapBtn} onPress={handleOpenMaps}>
              <MapPin size={18} color={colors.blue500} weight="fill" />
            </Pressable>
          ) : null}
        </View>

        {/* Quantity selector with increments */}
        <Text style={styles.label}>How much do you need? (kg)</Text>
        <View style={styles.counterRow}>
          <Pressable style={styles.counterBtn} onPress={decrementQty}>
            <Text style={styles.counterBtnText}>-</Text>
          </Pressable>
          <Text style={styles.counterVal}>{claimQty}</Text>
          <Pressable style={styles.counterBtn} onPress={incrementQty}>
            <Text style={styles.counterBtnText}>+</Text>
          </Pressable>
        </View>

        {/* Pickup Time Segment picker */}
        <Text style={styles.label}>Estimated Pickup Time</Text>
        <View style={styles.timeSegments}>
          {['15:00', '16:00', '17:00', '18:00'].map(t => (
            <Pressable
              key={t}
              style={[styles.timeChip, pickupTime === t && styles.timeChipActive]}
              onPress={() => setPickupTime(t)}
            >
              <Text style={[styles.timeText, pickupTime === t && styles.timeTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.timeNote}>
          Donor window: {formatWindowTime(listing.pickupWindowStart)} - {formatWindowTime(listing.pickupWindowEnd)}
        </Text>

        <View style={styles.spacer} />

        <Button
          label={submitting ? 'Confirming…' : `Confirm Claim (${claimQty} kg)`}
          onPress={handleClaim}
          disabled={submitting}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.md.fontSize,
    color: colors.neutral900,
  },
  content: {
    padding: spacing.screenHorizontal,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: colors.blue50,
    borderRadius: radius.card,
    padding: 20,
    marginBottom: spacing.s32,
    borderWidth: 1,
    borderColor: colors.blue100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  addressText: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.neutral600,
    flex: 1,
  },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.blue100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodName: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.lg.fontSize,
    color: colors.neutral900,
    marginBottom: 4,
  },
  donorName: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral600,
    marginBottom: 12,
  },
  qtyAvailable: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.md.fontSize,
    color: colors.blue500,
  },
  label: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral900,
    marginBottom: spacing.s12,
    marginTop: spacing.s20,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: spacing.s24,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.input,
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 20,
    fontFamily: typography.fonts.bold,
    color: colors.neutral900,
  },
  counterVal: {
    fontFamily: typography.fonts.bold,
    fontSize: 20,
    color: colors.neutral900,
    minWidth: 40,
    textAlign: 'center',
  },
  timeSegments: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  timeChip: {
    flex: 1,
    height: 44,
    borderRadius: radius.input,
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: colors.blue400,
    borderColor: colors.blue400,
  },
  timeText: {
    fontFamily: typography.fonts.medium,
    fontSize: 14,
    color: colors.neutral600,
  },
  timeTextActive: {
    color: colors.white,
  },
  timeNote: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral400,
  },
  spacer: {
    height: 40,
  }
});
