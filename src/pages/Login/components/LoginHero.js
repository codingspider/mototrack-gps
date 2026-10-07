// Top of the Login screen: brand shapes, logo mark and tagline.
// TODO: swap the logo mark for the real MotoTrack logo image in src/assets when it is added.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { colors, radius, spacing } from '../../../theme';

export default function LoginHero() {
  return (
    <View style={styles.hero}>
      <View style={styles.circle} />
      <View style={styles.ribbon} />
      <View style={styles.logoCircle}>
        <Icon source="map-marker-radius" size={44} color={colors.textOnPrimary} />
      </View>
      <AppText variant="title" color={colors.textOnPrimary} style={styles.name}>
        MotoTrack24
      </AppText>
      <AppText color={colors.textOnPrimary}>Track your vehicles live</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 260,
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    top: -90,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  ribbon: {
    position: 'absolute',
    bottom: -50,
    left: -40,
    width: 220,
    height: 110,
    backgroundColor: colors.primary,
    transform: [{ rotate: '-14deg' }],
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.textOnPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: { marginBottom: spacing.xs },
});
