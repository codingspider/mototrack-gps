// Recharge card from the design: wallet icon on the left (money drops into it), and on the right the red
// "Recharge Now" button with "Keep your service active" under it.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import routeNames from '../../../routes/routeNames';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageContext';

const DROP_MS = 1500; // money falls into the wallet
const PAUSE_MS = 600; // rest before it starts again
const BILL_START_Y = -26;
const BILL_END_Y = 2;

const makeStyles = (colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.secondaryLight,
      borderWidth: 1.5,
      borderBottomWidth: 4,
      borderColor: colors.secondaryBorder,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: radius.round,
      backgroundColor: colors.secondarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bill: { position: 'absolute', top: 6 },
    right: { flex: 1, gap: spacing.xs },
    hint: { textAlign: 'center' },
  });

export default function PayCard() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(0)).current; // 0 = money above the wallet, 1 = inside it

  // Loops forever: money drops in, the wallet bounces, short rest, again
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: DROP_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(PAUSE_MS),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const billY = progress.interpolate({ inputRange: [0, 0.7], outputRange: [BILL_START_Y, BILL_END_Y], extrapolate: 'clamp' });
  const billOpacity = progress.interpolate({ inputRange: [0, 0.15, 0.6, 0.75], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' });
  const billScale = progress.interpolate({ inputRange: [0, 0.7], outputRange: [1, 0.6], extrapolate: 'clamp' });
  const walletScale = progress.interpolate({ inputRange: [0, 0.65, 0.8, 1], outputRange: [1, 1, 1.18, 1], extrapolate: 'clamp' });

  // Opens the Renew page (pick the vehicles, a plan, then pay with DGePay)
  const openRenew = () => navigation.navigate(routeNames.payments);

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Animated.View style={{ transform: [{ scale: walletScale }] }}>
          <Icon source="wallet-outline" size={26} color={colors.secondary} />
        </Animated.View>
        <Animated.View style={[styles.bill, { opacity: billOpacity, transform: [{ translateY: billY }, { scale: billScale }] }]}>
          <Icon source="cash" size={22} color={colors.statusOnline} />
        </Animated.View>
      </View>
      <View style={styles.right}>
        <AppButton title={t('home.recharge')} variant="secondary" isCompact onPress={openRenew} />
        <AppText variant="caption" color={colors.textSecondary} style={styles.hint}>
          {t('home.keepActive')}
        </AppText>
      </View>
    </View>
  );
}
