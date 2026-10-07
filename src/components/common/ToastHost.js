// Shows the current toast from Redux at the top of the screen, colored by type. Mount once in App.js.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import AppText from './AppText';
import { dismissToast, selectToast } from '../../store/slices/toastSlice';
import { spacing, useAppTheme } from '../../theme';

const SHOW_FOR_MS = 4000;

export default function ToastHost() {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const toast = useSelector(selectToast);

  const toastStyles = {
    success: { color: colors.success, icon: 'check-circle-outline' },
    info: { color: colors.info, icon: 'information-outline' },
    warning: { color: colors.warning, icon: 'alert-outline' },
    error: { color: colors.error, icon: 'alert-circle-outline' },
  };
  const style = toastStyles[toast?.type] || toastStyles.info;

  return (
    <Snackbar
      // key restarts the timer and animation for every new toast
      key={toast?.id}
      visible={!!toast}
      onDismiss={() => dispatch(dismissToast())}
      duration={SHOW_FOR_MS}
      wrapperStyle={[styles.wrapper, { top: insets.top + spacing.sm }]}
      style={{ backgroundColor: style.color }}
      action={{ label: 'OK', textColor: colors.textOnPrimary, onPress: () => dispatch(dismissToast()) }}
    >
      <View style={styles.row}>
        <Icon source={style.icon} size={22} color={colors.textOnPrimary} />
        <AppText color={colors.textOnPrimary} style={styles.message}>
          {toast?.message}
        </AppText>
      </View>
    </Snackbar>
  );
}

const styles = StyleSheet.create({
  wrapper: { bottom: undefined },
  row: { flexDirection: 'row', alignItems: 'center' },
  message: { flex: 1, marginLeft: spacing.sm },
});
