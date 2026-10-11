module.exports = {
  preset: '@react-native/jest-preset',
  // Redux Toolkit and its helpers ship as modern ES modules: let Jest translate them too, so slices can be tested.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@reduxjs/toolkit|immer|redux|redux-thunk|reselect)/)',
  ],
};
