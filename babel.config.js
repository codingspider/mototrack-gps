module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Lets JavaScript read values from the .env file:  import { GOOGLE_MAPS_API_KEY } from '@env';
    ['module:react-native-dotenv', { moduleName: '@env', path: '.env', allowUndefined: true }],
  ],
};
