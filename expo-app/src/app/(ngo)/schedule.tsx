import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Modal, Alert, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useClaimStore, Claim } from '../../store/claimStore';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { Camera, Check, X, CaretLeft, CaretRight, CalendarBlank, Info, MapPin } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { ScreenTransition } from '../../components/ui/ScreenTransition';

function getWeekDays(weekOffset: number): { label: string; day: string; date: Date }[] {
  const today = new Date();
  today.setDate(today.getDate() + weekOffset * 7);
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, day: String(d.getDate()).padStart(2, '0'), date: d };
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function ClaimCard({ claim }: { claim: Claim }) {
  const handleOpenMaps = () => {
    const url = claim.lat && claim.lng
      ? `https://www.google.com/maps/search/?api=1&query=${claim.lat},${claim.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(claim.donorAddress)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open maps', 'There was an issue opening Google Maps.');
    });
  };

  return (
    <View style={claimCardStyles.card}>
      <View style={claimCardStyles.mainInfo}>
        <Text style={claimCardStyles.food}>{claim.foodName}</Text>
        <Text style={claimCardStyles.meta}>from {claim.donorName} • {claim.qtyClaimedKg} kg</Text>
        {claim.donorAddress ? (
          <View style={claimCardStyles.addressRow}>
            <MapPin size={14} color={colors.neutral400} weight="regular" />
            <Text style={claimCardStyles.addressText} numberOfLines={1}>
              {claim.donorAddress}
            </Text>
          </View>
        ) : null}
      </View>
      
      {claim.donorAddress ? (
        <Pressable style={claimCardStyles.mapBtn} onPress={handleOpenMaps}>
          <MapPin size={18} color={colors.blue500} weight="fill" />
        </Pressable>
      ) : null}
    </View>
  );
}

const claimCardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mainInfo: {
    flex: 1,
    gap: 4,
  },
  food: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 15,
    color: colors.neutral900,
  },
  meta: {
    fontFamily: typography.fonts.regular,
    fontSize: 13,
    color: colors.neutral600,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.neutral400,
    flex: 1,
  },
  mapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function NGOScheduleScreen() {
  const router = useRouter();
  const { claims, fetchMyClaims, subscribeRealtime, unsubscribeRealtime, verifyPickup } = useClaimStore();
  const [permission, requestPermission] = useCameraPermissions();
  
  // Week offset state: 0 is current week, -1 is previous, 1 is next, etc.
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = getWeekDays(weekOffset);

  const [scanVisible, setScanVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchMyClaims();
    subscribeRealtime('ngo');
    return () => unsubscribeRealtime();
  }, []);

  const claimedFood = claims
    .filter((c) => c.status === 'confirmed' && isSameDay(new Date(c.pickupTime), selectedDate))
    .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime());

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setScanning(true);
    setScanVisible(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    const result = await verifyPickup(data);

    if (result.error) {
      Alert.alert('Could not verify pickup', result.error, [{ text: 'Try again', onPress: () => setScanning(true) }]);
      return;
    }

    setScanVisible(false);
    setSuccessVisible(true);
  };

  // Get active month and year text for the current week slice
  const getMonthYearLabel = () => {
    const mondayDate = weekDays[0].date;
    const sundayDate = weekDays[6].date;
    const monMonth = mondayDate.toLocaleString('default', { month: 'long' });
    const sunMonth = sundayDate.toLocaleString('default', { month: 'long' });
    const yearStr = mondayDate.getFullYear();
    
    if (monMonth === sunMonth) {
      return `${monMonth} ${yearStr}`;
    }
    return `${monMonth} - ${sunMonth} ${yearStr}`;
  };

  return (
    <ScreenTransition>
      <SafeAreaView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Collection Schedule</Text>
          
          {/* Week Selector Row */}
          <View style={styles.weekSelectorRow}>
            <Text style={styles.monthLabel}>{getMonthYearLabel()}</Text>
            <View style={styles.navArrows}>
              <Pressable style={styles.arrowBtn} onPress={() => setWeekOffset(w => w - 1)}>
                <CaretLeft color={colors.neutral600} size={18} weight="bold" />
              </Pressable>
              <Pressable style={styles.arrowBtn} onPress={() => setWeekOffset(w => w + 1)}>
                <CaretRight color={colors.neutral600} size={18} weight="bold" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Weekly segment calendar view */}
        <View style={styles.calendarStrip}>
          {weekDays.map((d) => {
            const active = isSameDay(d.date, selectedDate);
            return (
              <Pressable
                key={d.date.toISOString()}
                style={[styles.calDay, active && styles.calDayActive]}
                onPress={() => setSelectedDate(d.date)}
              >
                <Text style={[styles.calLabel, active && styles.calLabelActive]}>{d.label}</Text>
                <Text style={[styles.calNum, active && styles.calNumActive]}>{d.day}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* List content */}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {claimedFood.length > 0 ? (
            <View style={styles.list}>
              {claimedFood.map(claim => (
                <View key={claim.id} style={styles.scheduleItem}>
                  <View style={styles.timeline}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineLine} />
                  </View>
                  <View style={styles.cardContainer}>
                    <Text style={styles.timeLabel}>
                      {new Date(claim.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <ClaimCard claim={claim} />
                    <Pressable style={styles.scanBtn} onPress={openScanner}>
                      <Camera color={colors.white} size={18} weight="bold" />
                      <Text style={styles.scanBtnText}>Verify Collection</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <CalendarBlank size={36} color={colors.neutral400} weight="thin" />
              </View>
              <Text style={styles.emptyText}>No Collections Scheduled</Text>
              <Text style={styles.emptySubtext}>You have no pending pickups for this date.</Text>
              <Pressable style={styles.browseBtn} onPress={() => router.push('/(ngo)/browse' as any)}>
                <Text style={styles.browseBtnText}>Browse Available Food</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Real camera-based QR scanner */}
        <Modal visible={scanVisible} transparent animationType="slide">
          <View style={styles.modalScrim}>
            <View style={styles.scannerWindow}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Scan Donor QR Code</Text>
                <Pressable onPress={() => setScanVisible(false)}>
                  <X color={colors.neutral900} size={24} />
                </Pressable>
              </View>
              <View style={styles.cameraBox}>
                {permission?.granted ? (
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
                  />
                ) : null}
                <View style={styles.focusFrame} pointerEvents="none" />
                <Text style={styles.cameraSub}>Align QR code inside frame</Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* Verification Success Feedback modal */}
        <Modal visible={successVisible} transparent animationType="fade">
          <View style={styles.modalScrim}>
            <View style={styles.successCard}>
              <View style={styles.successIcon}>
                <Check color={colors.white} size={32} weight="bold" />
              </View>
              <Text style={styles.successTitle}>Pickup Verified</Text>
              <Text style={styles.successSub}>Collection completed successfully. Impact metrics updated!</Text>
              <Pressable style={styles.closeBtn} onPress={() => setSuccessVisible(false)}>
                <Text style={styles.closeBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 24,
    paddingBottom: 8,
  },
  pageTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 24,
    color: colors.neutral900,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  weekSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  monthLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 16,
    color: colors.neutral900,
  },
  navArrows: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.neutral50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral100,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    marginVertical: 14,
  },
  calDay: {
    alignItems: 'center',
    paddingVertical: 10,
    width: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral50,
    backgroundColor: colors.neutral50,
  },
  calDayActive: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
  calLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 10,
    color: colors.neutral400,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  calLabelActive: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: typography.fonts.semiBold,
  },
  calNum: {
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    color: colors.neutral900,
  },
  calNumActive: {
    color: colors.white,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 40,
  },
  list: {
    gap: 0,
  },
  scheduleItem: {
    flexDirection: 'row',
  },
  timeline: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue400,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.neutral200,
    marginTop: 4,
    marginBottom: -4,
  },
  cardContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  timeLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 13,
    color: colors.neutral600,
    marginBottom: 8,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.blue500,
    height: 48,
    borderRadius: radius.button,
    marginTop: 10,
  },
  scanBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 14,
    color: colors.white,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.neutral50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.neutral100,
  },
  emptyText: {
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    color: colors.neutral900,
    marginBottom: 6,
  },
  emptySubtext: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.neutral400,
    textAlign: 'center',
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: colors.blue50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.blue100,
  },
  browseBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 13,
    color: colors.blue600,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(26,43,60,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scannerWindow: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 20,
    gap: 16,
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
  cameraBox: {
    height: 240,
    backgroundColor: colors.neutral900,
    borderRadius: radius.card,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  focusFrame: {
    width: 140,
    height: 140,
    borderWidth: 2,
    borderColor: colors.blue400,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  cameraSub: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
  },
  successCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    ...shadows.float,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.lg.fontSize,
    color: colors.neutral900,
  },
  successSub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral600,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeBtn: {
    width: '100%',
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.neutral900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 14,
    color: colors.white,
  }
});
