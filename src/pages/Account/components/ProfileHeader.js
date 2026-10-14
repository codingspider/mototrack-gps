// The colored block at the top of the Profile screen: avatar, name, phone, and the Logout button.
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Icon, IconButton, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageContext';

const AVATAR_SIZE = 96;

const makeStyles = (colors) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      paddingBottom: spacing.xl,
      backgroundColor: colors.primary,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },
    topRow: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
    },
    logout: { alignItems: 'center', padding: spacing.sm, borderRadius: radius.md },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: radius.round,
      borderWidth: 3,
      borderColor: colors.textOnPrimary,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    photo: { width: AVATAR_SIZE, height: AVATAR_SIZE },
    name: { marginTop: spacing.md, fontWeight: '700' },
  });

/**
 * @param {object|null} profile From Redux ({ first_name, last_name, phone_number, photo_url })
 * @param {function} onBack Arrow at the top left (this screen has no navigation header)
 * @param {function} onLogout
 */
export default function ProfileHeader({ profile, onBack, onLogout }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <IconButton icon="arrow-left" size={24} iconColor={colors.textOnPrimary} onPress={onBack} accessibilityLabel={t('common.back')} />
        <TouchableRipple borderless style={styles.logout} onPress={onLogout} accessibilityLabel={t('account.logout')}>
          <View style={styles.logout}>
            <Icon source="logout" size={24} color={colors.textOnPrimary} />
            <AppText variant="caption" color={colors.textOnPrimary}>
              {t('account.logout')}
            </AppText>
          </View>
        </TouchableRipple>
      </View>
      <View style={styles.avatar}>
        {profile?.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={styles.photo} />
        ) : (
          <Icon source="account" size={56} color={colors.primary} />
        )}
      </View>
      <AppText variant="subtitle" color={colors.textOnPrimary} style={styles.name}>
        {fullName || t('account.myAccount')}
      </AppText>
      {!!profile?.phone_number && (
        <AppText color={colors.textOnPrimary}>{profile.phone_number}</AppText>
      )}
    </View>
  );
}
