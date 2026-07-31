import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useListingStore } from '../../store/listingStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { FoodCard } from '../../components/FoodCard';
import { useRouter } from 'expo-router';
import { Funnel, MapPin, Scales, Sparkle } from 'phosphor-react-native';
import { ScreenTransition } from '../../components/ui/ScreenTransition';

const CATEGORIES = ['All', 'Cooked Meals', 'Raw Produce', 'Packaged Goods', 'Beverages', 'Bakery'];
const DISTANCES = [5, 10, 20, 50];
const QUANTITIES = [
  { label: 'Any Quantity', value: 0 },
  { label: '> 5 kg', value: 5 },
  { label: '> 10 kg', value: 10 },
  { label: '> 25 kg', value: 25 }
];

export default function NGOBrowseScreen() {
  const router = useRouter();
  const { listings, fetchListings, subscribeRealtime, unsubscribeRealtime } = useListingStore();
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Clean, visual filters
  const [maxDistance, setMaxDistance] = useState(20);
  const [minQty, setMinQty] = useState(0);

  useEffect(() => {
    fetchListings();
    subscribeRealtime();
    return () => unsubscribeRealtime();
  }, []);

  const availableFood = listings.filter((l) => l.status === 'available' || l.status === 'partial');

  const filteredFood = availableFood.filter(l => {
    // Category match
    if (activeCategory !== 'All' && l.category !== activeCategory) {
      return false;
    }
    // Min Quantity match
    if (minQty > 0 && l.qty < minQty) {
      return false;
    }
    // Distance filter
    const distanceVal = parseFloat(l.distance);
    if (!isNaN(distanceVal) && distanceVal > maxDistance) {
      return false;
    }
    return true;
  });

  return (
    <ScreenTransition>
      <SafeAreaView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Available Food</Text>
            <View style={styles.pulseBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>Live Feed</Text>
            </View>
          </View>
          <Text style={styles.pageSubtitle}>Claim fresh donations from verified local businesses</Text>
        </View>

        {/* Filter Quick Selection Section */}
        <View style={styles.filtersSection}>
          {/* Proximity Filter Row */}
          <View style={styles.filterRow}>
            <View style={styles.rowLabelGroup}>
              <MapPin size={16} color={colors.blue500} weight="fill" />
              <Text style={styles.filterRowLabel}>Radius</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {DISTANCES.map(dist => (
                <Pressable
                  key={dist}
                  style={[styles.filterChip, maxDistance === dist && styles.filterChipActive]}
                  onPress={() => setMaxDistance(dist)}
                >
                  <Text style={[styles.filterChipText, maxDistance === dist && styles.filterChipTextActive]}>
                    Within {dist} km
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Min Quantity Filter Row */}
          <View style={styles.filterRow}>
            <View style={styles.rowLabelGroup}>
              <Scales size={16} color={colors.blue500} weight="fill" />
              <Text style={styles.filterRowLabel}>Min Qty</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {QUANTITIES.map(qty => (
                <Pressable
                  key={qty.value}
                  style={[styles.filterChip, minQty === qty.value && styles.filterChipActive]}
                  onPress={() => setMinQty(qty.value)}
                >
                  <Text style={[styles.filterChipText, minQty === qty.value && styles.filterChipTextActive]}>
                    {qty.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Horizontal Category chips selector */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map(c => (
              <Pressable
                key={c}
                style={[styles.catChip, activeCategory === c && styles.catChipActive]}
                onPress={() => setActiveCategory(c)}
              >
                <Text style={[styles.catText, activeCategory === c && styles.catTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Listings List */}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {filteredFood.length > 0 ? (
            <View style={styles.list}>
              {filteredFood.map(listing => (
                <Pressable key={listing.id} onPress={() => router.push(`/(ngo)/claim-sheet?id=${listing.id}` as any)}>
                  <FoodCard listing={listing} />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Sparkle size={32} color={colors.neutral400} weight="thin" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No matches found</Text>
              <Text style={styles.emptySubtext}>Try expanding your search radius or selecting a different category.</Text>
            </View>
          )}
        </ScrollView>
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
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pageTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 24,
    color: colors.neutral900,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 13,
    color: colors.neutral400,
    lineHeight: 18,
  },
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  pulseText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 10,
    color: colors.green,
    textTransform: 'uppercase',
  },
  filtersSection: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: 16,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 70,
  },
  filterRowLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 12,
    color: colors.neutral600,
  },
  chipScroll: {
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral100,
  },
  filterChipActive: {
    backgroundColor: colors.blue50,
    borderColor: colors.blue400,
  },
  filterChipText: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.neutral600,
  },
  filterChipTextActive: {
    color: colors.blue600,
    fontFamily: typography.fonts.semiBold,
  },
  categoryContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
    paddingBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral100,
  },
  catChipActive: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
  catText: {
    fontFamily: typography.fonts.medium,
    fontSize: 12,
    color: colors.neutral600,
  },
  catTextActive: {
    color: colors.white,
    fontFamily: typography.fonts.semiBold,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 40,
  },
  list: {
    gap: 12,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    color: colors.neutral900,
    marginBottom: 4,
  },
  emptySubtext: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.neutral400,
    textAlign: 'center',
    paddingHorizontal: 32,
  }
});
