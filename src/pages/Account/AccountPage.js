// Minimal Account screen for now: who is logged in + Logout. Profile editing comes later.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../components/common/AppButton';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import { logoutUser } from '../../store/slices/authSlice';
import { selectProfile } from '../../store/slices/profileSlice';
import { colors, spacing } from '../../theme';

export default function AccountPage() {
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);
  const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <AppText variant="subtitle">{fullName || 'My account'}</AppText>
        <AppText color={colors.textSecondary}>{profile?.phone_number || ''}</AppText>
      </Card>
      <AppButton title="Log out" variant="secondary" onPress={() => dispatch(logoutUser())} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  card: { marginBottom: spacing.lg },
});