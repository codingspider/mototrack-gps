// The language of the app (English or Bangla). The choice is remembered on the phone, like the theme mode.
//   const { t, language, toggleLanguage } = useTranslation();   t('login.welcome')
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from './translations';

const STORAGE_KEY = 'mototrack_language'; // 'en' | 'bn' (not a secret, so AsyncStorage is fine)

const LanguageContext = createContext({
  language: 'en',
  t: (key, values) => translate('en', key, values),
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  // Read the saved choice once at start
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        if (value === 'en' || value === 'bn') {
          setLanguage(value);
        }
      } catch (error) {
        // Storage not available: stay on English
      }
    };
    loadLanguage();
  }, []);

  const toggleLanguage = useCallback(async () => {
    const next = language === 'en' ? 'bn' : 'en';
    setLanguage(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      // The language still changes for this session
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      toggleLanguage,
      // Falls back to English, then to the key itself, so a missing word never shows blank
      t: (key, values) => translate(language, key, values),
    }),
    [language, toggleLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/** The translate function and the language switch. */
export function useTranslation() {
  return useContext(LanguageContext);
}
