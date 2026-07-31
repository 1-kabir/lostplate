import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Modal,
  Image,
  Animated,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../../store/authStore';
import { useListingStore, Listing } from '../../store/listingStore';
import { useClaimStore } from '../../store/claimStore';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { FoodCard } from '../../components/FoodCard';
import { useRouter } from 'expo-router';
import { Plus, QrCode, X, Clock, Scales, Calendar } from 'phosphor-react-native';

export default function DonorListingsScreen() {
  const { user } = useAuthStore();
  const { listings, fetchListings, subscribeRealtime, unsubscribeRealtime } = useListingStore();
  const { claims, fetchClaimsOnMyListings, subscribeRealtime: subscribeClaims, unsubscribeRealtime: unsubscribeClaims } = useClaimStore();
  const router = useRouter();

  useEffect(() => {
    fetchListings();
    fetchClaimsOnMyListings();
    subscribeRealtime();
    subscribeClaims('donor');
    return () => {
      unsubscribeRealtime();
      unsubscribeClaims();
    };
  }, []);

  const myListings = listings.filter((l) => l.donorId === user?.id && l.status !== 'expired');

  // Animated Bottom Drawer State
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(500)).current;
  
  const activeClaimForSelected = selectedListing
    ? claims.find((c) => c.listingId === selectedListing.id && c.status === 'confirmed')
    : undefined;

  const openDrawer = (listing: Listing) => {
    setSelectedListing(listing);
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(({ finished }) => {
      if (finished) {
        setIsDrawerOpen(false);
        setSelectedListing(null);
      }
    });
  };

  // Parses listing's photoUrl which could be a single string URL or a JSON array of string URLs
  const parseImages = (photoUrl: string | null): string[] => {
    if (!photoUrl) return [];
    if (photoUrl.startsWith('[')) {
      try {
        return JSON.parse(photoUrl);
      } catch {
        return [photoUrl];
      }
    }
    return [photoUrl];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>My Listings</Text>
            <Text style={styles.count}>
              {myListings.length} listing{myListings.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {myListings.length > 0 ? (
          <View style={styles.list}>
            {myListings.map((listing) => {
              const hasActiveClaim = claims.some((c) => c.listingId === listing.id && c.status === 'confirmed');
              return (
                <Pressable
                  key={listing.id}
                  onPress={() => openDrawer(listing)}
                >
                  <FoodCard listing={listing} />
                  {hasActiveClaim && (
                    <View style={styles.claimedBadgeRow}>
                      <QrCode color={colors.blue500} size={16} />
                      <Text style={styles.claimedBadgeText}>Active Claim — Tap for Details / QR</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No active listings.{'\n'}Tap + to add one.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(donor)/list-food')}
      >
        <Plus color={colors.white} size={24} weight="bold" />
      </Pressable>

      {/* Details Bottom Drawer */}
      <Modal visible={isDrawerOpen} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.modalScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(26,43,60,0.5)', opacity: fadeAnim }]} />
          <Animated.View style={[styles.detailsCard, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.indicatorHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Listing Details</Text>
              <Pressable onPress={closeDrawer} style={styles.closeBtn}>
                <X color={colors.neutral900} size={24} />
              </Pressable>
            </View>

            {selectedListing && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <Text style={styles.foodTitle}>{selectedListing.foodName}</Text>
                
                {/* Meta details row */}
                <View style={styles.metaBadgeRow}>
                  <View style={styles.metaBadge}>
                    <Scales size={14} color={colors.neutral600} />
                    <Text style={styles.metaBadgeText}>{selectedListing.qty} kg remaining</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Calendar size={14} color={colors.neutral600} />
                    <Text style={styles.metaBadgeText}>{selectedListing.category}</Text>
                  </View>
                </View>

                {/* Uploaded image(s) gallery */}
                {parseImages(selectedListing.photoUrl).length > 0 && (
                  <View style={styles.gallerySection}>
                    <Text style={styles.sectionLabel}>Uploaded Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
                      {parseImages(selectedListing.photoUrl).map((url, idx) => (
                        <Image key={idx} source={{ uri: url }} style={styles.galleryImage} resizeMode="cover" />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Pickup Window Info */}
                <View style={styles.infoBlock}>
                  <Clock size={16} color={colors.neutral600} />
                  <View>
                    <Text style={styles.infoLabel}>Preferred Pickup Range</Text>
                    <Text style={styles.infoValue}>
                      {selectedListing.pickupWindowStart
                        ? new Date(selectedListing.pickupWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Anytime'}{' '}
                      to{' '}
                      {selectedListing.pickupWindowEnd
                        ? new Date(selectedListing.pickupWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Anytime'}
                    </Text>
                  </View>
                </View>

                {/* Claim / QR verification section */}
                {activeClaimForSelected ? (
                  <View style={styles.qrSection}>
                    <View style={styles.qrHeader}>
                      <QrCode color={colors.blue500} size={20} />
                      <Text style={styles.qrSectionTitle}>Verification QR Code</Text>
                    </View>
                    <Text style={styles.qrClaimInfo}>
                      Claimed by {activeClaimForSelected.ngoName} • {activeClaimForSelected.qtyClaimedKg} kg
                    </Text>
                    <View style={styles.qrSquare}>
                      <QRCode value={activeClaimForSelected.qrToken} size={150} color={colors.neutral900} backgroundColor={colors.white} />
                    </View>
                    <Text style={styles.qrSub}>
                      Present this code to the NGO driver upon pickup to finalize verification.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noClaimBlock}>
                    <Text style={styles.noClaimText}>Waiting to be claimed by local NGOs</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </Animated.View>
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
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 24,
    paddingBottom: 100,
  },
  pageHeader: {
    marginBottom: spacing.s24,
  },
  pageTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.neutral900,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  count: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral400,
  },
  list: {
    gap: 12,
  },
  claimedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 14,
  },
  claimedBadgeText: {
    fontFamily: typography.fonts.medium,
    fontSize: 12,
    color: colors.blue500,
  },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral400,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 100,
    backgroundColor: colors.blue400,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.float,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(26,43,60,0.5)',
    justifyContent: 'flex-end',
  },
  detailsCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    ...shadows.float,
  },
  indicatorHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral200,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
    paddingBottom: 12,
  },
  modalTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    color: colors.neutral900,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingTop: 16,
    gap: 16,
  },
  foodTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 20,
    color: colors.neutral900,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontFamily: typography.fonts.medium,
    fontSize: 12,
    color: colors.neutral600,
  },
  gallerySection: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 12,
    color: colors.neutral400,
    textTransform: 'uppercase',
  },
  galleryScroll: {
    gap: 8,
  },
  galleryImage: {
    width: 120,
    height: 90,
    borderRadius: radius.card,
    backgroundColor: colors.neutral50,
  },
  infoBlock: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral100,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.neutral400,
  },
  infoValue: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 13,
    color: colors.neutral900,
  },
  qrSection: {
    backgroundColor: colors.blue50,
    borderColor: colors.blue200,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrSectionTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    color: colors.blue600,
  },
  qrClaimInfo: {
    fontFamily: typography.fonts.medium,
    fontSize: 12,
    color: colors.neutral600,
  },
  qrSquare: {
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.blue100,
    marginVertical: 4,
  },
  qrSub: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    color: colors.neutral400,
    textAlign: 'center',
    lineHeight: 16,
  },
  noClaimBlock: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  noClaimText: {
    fontFamily: typography.fonts.medium,
    fontSize: 13,
    color: colors.neutral400,
    fontStyle: 'italic',
  }
});
