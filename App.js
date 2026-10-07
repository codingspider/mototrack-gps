// App root: Redux store + Paper theme + navigation + the shared HTTP client setup.
import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import store from './src/store';
import RootNavigator from './src/routes/RootNavigator';
import { setupInterceptors } from './src/api/client';
import { logoutUser } from './src/store/slices/authSlice';
import { colors } from './src/theme';
import paperTheme from './src/theme/paperTheme';

// Lets the HTTP client read the hash and log out when the server rejects the session.
setupInterceptors(store, () => store.dispatch(logoutUser()));

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar backgroundColor={colors.surface} barStyle="dark-content" />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
