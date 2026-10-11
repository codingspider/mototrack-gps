// The arrow at the left of a bottom-tab screen's header: back to Home.
// React Navigation calls `headerLeft` as a plain function, so screens pass `renderBackToHomeButton` (it only returns
// this component, whose hooks then run inside it).
import React from 'react';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import routeNames from '../../routes/routeNames';
import { useAppTheme } from '../../theme';

export default function BackToHomeButton() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();

  return (
    <IconButton
      icon="arrow-left"
      size={24}
      iconColor={colors.text}
      onPress={() => navigation.navigate(routeNames.home)}
      accessibilityLabel="Back to Home"
    />
  );
}

export const renderBackToHomeButton = () => <BackToHomeButton />;
