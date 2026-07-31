import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useListingStore } from '../../store/listingStore';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { FoodCard } from '../../components/FoodCard';

export default function MyDonationsFeed() {
  const { user } = useAuthStore();
  const { listings, fetchListings, subscribeRealtime, unsubscribeRealtime } = useListingStore();

  useEffect(() => {
    fetchListings();
    subscribeRealtime();
    return () => unsubscribeRealtime();
  }, []);

  const myDonations = listings.filter((l) => l.donorId === user?.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>My Donations</Text>
        
        {myDonations.length > 0 ? (
          <View style={styles.list}>
            {myDonations.map(listing => (
              <FoodCard key={listing.id} listing={listing} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You haven't listed any food yet.</Text>
          </View>
        )}
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
    padding: spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.neutral900,
    marginBottom: spacing.s24,
  },
  list: {
    gap: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral400,
  }
});
