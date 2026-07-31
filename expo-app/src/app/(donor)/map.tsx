import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, Platform } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase, UserRow } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { haversineKm } from '../../store/listingStore';
import { colors, typography, radius, shadows, spacing } from '../../constants/theme';
import { Users } from 'phosphor-react-native';

const { width, height } = Dimensions.get('window');

// Fallback region used only if neither the donor's own address nor device
// location is available yet — most of the time initialRegion below wins.
const FALLBACK_REGION = {
  latitude: 22.5726,
  longitude: 88.3639,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

interface NgoPin {
  id: string;
  name: string;
  address: string | null;
  capacityKg: number;
  lat: number;
  lng: number;
  distanceKm: number | null;
}

export default function DonorMapScreen() {
  const { user } = useAuthStore();
  const [ngos, setNgos] = useState<NgoPin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNgos() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('type', 'ngo')
        .eq('verification_status', 'approved')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error || cancelled) return;

      const pins = ((data ?? []) as UserRow[]).map((row) => ({
        id: row.id,
        name: row.name ?? 'Unnamed NGO',
        address: row.address,
        capacityKg: row.max_capacity_kg,
        lat: row.lat as number,
        lng: row.lng as number,
        distanceKm:
          user?.lat != null && user?.lng != null
            ? haversineKm(user.lat, user.lng, row.lat as number, row.lng as number)
            : null,
      }));
      setNgos(pins);
    }

    loadNgos();
    return () => {
      cancelled = true;
    };
  }, [user?.lat, user?.lng]);

  const initialRegion =
    user?.lat != null && user?.lng != null
      ? { latitude: user.lat, longitude: user.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }
      : FALLBACK_REGION;

  const selected = ngos.find((n) => n.id === selectedId);

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        // Android's Google-backed provider needs an OSM raster overlay to
        // actually show OpenStreetMap tiles (and to keep working without a
        // paid Google Maps API key); iOS's Apple Maps base already renders
        // fine on its own, so the overlay is skipped there.
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {Platform.OS === 'android' && (
          <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
        )}
        {ngos.map((ngo) => (
          <Marker
            key={ngo.id}
            coordinate={{ latitude: ngo.lat, longitude: ngo.lng }}
            onPress={() => setSelectedId(ngo.id)}
          >
            <View style={[styles.pin, { backgroundColor: colors.blue400 }]}>
              <Users color={colors.white} size={16} weight="bold" />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.controlsStrip}>
        <View style={styles.pillControl}>
          <Text style={styles.pillText}>{ngos.length} verified NGO{ngos.length === 1 ? '' : 's'} nearby</Text>
        </View>
      </View>

      {selected && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.row}>
            <Text style={styles.sheetTitle}>{selected.name}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.sheetSubtitle}>
            Capacity: {selected.capacityKg}kg/day
            {selected.distanceKm != null ? ` • ${selected.distanceKm.toFixed(1)} km` : ''}
          </Text>

          <Pressable style={styles.claimBtn} onPress={() => setSelectedId(null)}>
            <Text style={styles.claimBtnText}>Close</Text>
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
    top: 24,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.lg.fontSize,
    color: colors.neutral900,
  },
  verifiedBadge: {
    backgroundColor: colors.verified + '1E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  verifiedText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 11,
    color: colors.verified,
    letterSpacing: 0.4,
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