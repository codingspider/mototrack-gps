// A field that opens a list to pick one option (vehicle, month, status, limit...).
import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Icon, Modal, Portal, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import FieldBox from './FieldBox';

const makeStyles = (colors) =>
  StyleSheet.create({
    modal: { margin: spacing.xl, maxHeight: '70%', borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' },
    title: { padding: spacing.lg, paddingBottom: spacing.sm },
    option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    optionText: { flex: 1 },
  });

/**
 * @param {string} label Field label
 * @param {Array<{value, label}>} options What can be picked
 * @param {*} value The chosen option's value
 * @param {function} onChange Called with the picked value
 * @param {boolean} isFull The field takes the whole row
 */
export default function SelectField({ label, options, value, onChange, isFull }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [isOpen, setIsOpen] = useState(false);
  const chosen = options.find((option) => option.value === value);

  const pick = (option) => {
    setIsOpen(false);
    onChange(option.value);
  };

  return (
    <>
      <FieldBox label={label} text={chosen ? chosen.label : '-'} isFull={isFull} onPress={() => setIsOpen(true)} />
      <Portal>
        <Modal visible={isOpen} onDismiss={() => setIsOpen(false)} contentContainerStyle={styles.modal}>
          <AppText variant="subtitle" style={styles.title}>
            {label}
          </AppText>
          <FlatList
            data={options}
            keyExtractor={(option) => String(option.value)}
            renderItem={({ item }) => {
              const isChosen = item.value === value;
              return (
                <TouchableRipple onPress={() => pick(item)}>
                  <View style={styles.option}>
                    <AppText style={styles.optionText} color={isChosen ? colors.primary : colors.text}>
                      {item.label}
                    </AppText>
                    {isChosen && <Icon source="check" size={20} color={colors.primary} />}
                  </View>
                </TouchableRipple>
              );
            }}
          />
        </Modal>
      </Portal>
    </>
  );
}
