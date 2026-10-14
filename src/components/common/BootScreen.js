// The first screen while the app checks the saved login: the primary color with the white logo, the same picture
// as the native launch screen (android/app/src/main/res/drawable/splash_background.xml), so nothing flashes.
import React from 'react';
import { Image, StatusBar, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme';

const LOGO_SIZE = 242; // same size as the native launch screen

export default function BootScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.primary }]}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <Image source={require('../../assets/logo-white.webp')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE },
});
