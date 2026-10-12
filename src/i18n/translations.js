// The words shown on screen, in English and Bangla. A key that is missing in Bangla shows the English text.
// Only the Login screen uses this so far: add a key here, then call t('key') in the component.
export const LANGUAGES = {
  en: 'English',
  bn: 'বাংলা',
};

const translations = {
  en: {
    'login.welcome': 'Welcome Back',
    'login.emailOrPhone': 'Email or phone number',
    'login.password': 'Password',
    'login.rememberMe': 'Remember me',
    'login.forgotPassword': 'Forgot password?',
    'login.signIn': 'SIGN IN',
    'login.or': 'or',
    'login.callSupport': 'Call for any assistance',
    'login.callSupportLabel': 'Call support',
    'login.enterBoth': 'Please enter your email or phone and your password',
    'login.language': 'Language',
    'login.theme': 'Theme',
  },
  bn: {
    'login.welcome': 'আবার স্বাগতম',
    'login.emailOrPhone': 'ইমেইল বা ফোন নম্বর',
    'login.password': 'পাসওয়ার্ড',
    'login.rememberMe': 'আমাকে মনে রাখুন',
    'login.forgotPassword': 'পাসওয়ার্ড ভুলে গেছেন?',
    'login.signIn': 'সাইন ইন',
    'login.or': 'অথবা',
    'login.callSupport': 'যেকোনো সহায়তার জন্য কল করুন',
    'login.callSupportLabel': 'সাপোর্টে কল করুন',
    'login.enterBoth': 'অনুগ্রহ করে ইমেইল বা ফোন নম্বর এবং পাসওয়ার্ড দিন',
    'login.language': 'ভাষা',
    'login.theme': 'থিম',
  },
};

export default translations;
