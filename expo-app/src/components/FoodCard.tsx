import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../constants/theme';
import { Listing } from '../store/listingStore';
import { StatusPill } from './ui/Badge';

export const FoodCard: React.FC<{ listing: Listing }> = ({ listing }) => {
  const urgencyColor = listing.urgency === 'red' ? colors.red : listing.urgency === 'amber' ? colors.amber : colors.green;

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.urgencyBar, { backgroundColor: urgencyColor }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.foodName} numberOfLines={1}>{listing.foodName}</Text>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{listing.category}</Text>
          </View>
        </View>
        <View style={styles.middleRow}>
          <Text style={styles.qty}>{listing.qty} kg</Text>
          <Text style={styles.donorName}>{listing.donorName}</Text>
        </View>
        <View style={styles.bottomRow}>
          <StatusPill status={listing.status} />
          <Text style={styles.meta}>{listing.distance} • {listing.timeRemaining}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  urgencyBar: {
    width: 3,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.md.fontSize,
    color: colors.neutral900,
  },
  categoryChip: {
    backgroundColor: colors.blue50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  categoryText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.xs.fontSize,
    color: colors.blue600,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  qty: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.blue500,
    letterSpacing: -0.5,
  },
  donorName: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral600,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: colors.neutral400,
  },
  meta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral600,
  }
});
