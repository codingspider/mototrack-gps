// Pop up that asks for the geofence name, then saves it.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import AppButton from '../common/AppButton';
import AppInput from '../common/AppInput';
import AppText from '../common/AppText';
import { isBlank } from '../../utils/validators';
import { radius, spacing, useThemedStyles } from '../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    modal: { margin: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface },
    title: { marginBottom: spacing.md },
    buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  });

/**
 * @param {boolean} visible
 * @param {boolean} isSaving Request is running (button shows a spinner)
 * @param {function} onSave Called with the name
 * @param {function} onDismiss
 * @param {function} onInvalid Called when the name is empty
 */
export default function GeofenceNameModal({ visible, isSaving, onSave, onDismiss, onInvalid }) {
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
    }
  }, [visible]);

  const handleSave = () => {
    if (isBlank(name)) {
      onInvalid();
      return;
    }
    onSave(name);
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={isSaving ? undefined : onDismiss} contentContainerStyle={styles.modal}>
        <AppText variant="subtitle" style={styles.title}>
          Save geofence
        </AppText>
        <AppInput label="Geofence name" value={name} onChangeText={setName} autoCapitalize="words" />
        <View style={styles.buttons}>
          <AppButton title="Cancel" variant="link" onPress={onDismiss} isDisabled={isSaving} />
          <AppButton title="Save" onPress={handleSave} isLoading={isSaving} />
        </View>
      </Modal>
    </Portal>
  );
}
