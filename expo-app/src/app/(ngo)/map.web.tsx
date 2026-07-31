import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants/theme';
import { MapPin } from 'phosphor-react-native';

export default function NGOMapScreen() {
  return (
    <View style={styles.container}>
      <MapPin color={colors.neutral200} size={48} weight="regular" />
      <Text style={styles.title}>Map unavailable on web</Text>
      <Text style={styles.sub}>Open the app on a mobile device to view the donor map.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  title: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.md.fontSize,
    color: colors.neutral600,
    textAlign: 'center',
  },
  sub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral400,
    textAlign: 'center',
    lineHeight: 20,
  },
});
