import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, Platform } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useListingStore } from '../../store/listingStore';
import { useAuthStore } from '../../store/authStore';
import { colors, typography, radius, shadows, spacing } from '../../constants/theme';
import { ForkKnife } from 'phosphor-react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Fallback region used only until the NGO's own geocoded address (or a real
// listing pin) gives us something better to center on.
const FALLBACK_REGION = {
  latitude: 22.5726,
  longitude: 88.3639,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function NGOMapScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { listings, fetchListings, subscribeRealtime, unsubscribeRealtime } = useListingStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
    subscribeRealtime();
    return () => unsubscribeRealtime();
  }, []);

  // 'partial' listings still have qty left — they belong on the map too,
  // only 'fully_claimed' / 'collected' / 'expired' should disappear from it.
  const availableFood = listings.filter(
    (l) => (l.status === 'available' || l.status === 'partial') && l.lat != null && l.lng != null
  );

  const initialRegion =
    user?.lat != null && user?.lng != null
      ? { latitude: user.lat, longitude: user.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }
      : FALLBACK_REGION;

  const selectedListing = availableFood.find((l) => l.id === selectedId);

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {Platform.OS === 'android' && (
          <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
        )}
        {availableFood.map((listing) => {
          const urgencyColor =
            listing.urgency === 'red' ? colors.red : listing.urgency === 'amber' ? colors.amber : colors.green;

          return (
            <Marker
              key={listing.id}
              coordinate={{ latitude: listing.lat as number, longitude: listing.lng as number }}
              onPress={() => setSelectedId(listing.id)}
            >
              <View style={[styles.pin, { backgroundColor: urgencyColor }]}>
                <ForkKnife color={colors.white} size={16} weight="bold" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.controlsStrip}>
        <View style={styles.pillControl}>
          <Text style={styles.pillText}>{availableFood.length} donation{availableFood.length === 1 ? '' : 's'} nearby</Text>
        </View>
      </View>

      {selectedListing && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{selectedListing.foodName}</Text>
          <Text style={styles.sheetSubtitle}>
            {selectedListing.qty} kg • {selectedListing.distance} • {selectedListing.donorName}
          </Text>
          <Pressable
            style={styles.claimBtn}
            onPress={() => router.push(`/(ngo)/claim-sheet?id=${selectedListing.id}` as any)}
          >
            <Text style={styles.claimBtnText}>View Details</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral0,
  },
  map: {
    width,
    height,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.map,
  },
  controlsStrip: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pillControl: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.mapControl,
    borderWidth: 1,
    borderColor: colors.neutral200,
    ...shadows.map,
  },
  pillText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral900,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheetTop,
    borderTopRightRadius: radius.sheetTop,
    padding: spacing.screenHorizontal,
    paddingTop: 12,
    ...shadows.float,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.lg.fontSize,
    color: colors.neutral900,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral600,
    marginBottom: 24,
  },
  claimBtn: {
    backgroundColor: colors.blue400,
    height: 56,
    borderRadius: radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  claimBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 16,
    color: colors.white,
  }
});
