import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../../constants/theme';
import { Status } from '../../store/listingStore';

const STATUS_LABEL: Record<Status, string> = {
  available: 'AVAILABLE',
  partial: 'PARTIALLY CLAIMED',
  fully_claimed: 'CLAIMED',
  collected: 'COLLECTED',
  expired: 'EXPIRED',
};

const STATUS_COLOR: Record<Status, string> = {
  available: colors.green,
  partial: colors.amber,
  fully_claimed: colors.blue500,
  collected: colors.blue600,
  expired: colors.neutral400,
};

export const StatusPill: React.FC<{ status: Status }> = ({ status }) => {
  const color = STATUS_COLOR[status] ?? colors.neutral400;

  return (
    <View style={[styles.pill, { backgroundColor: `${color}1E` }]}>
      <Text style={[styles.text, { color }]}>{STATUS_LABEL[status] ?? status.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
  }
});
