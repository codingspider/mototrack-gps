module.exports = {
  preset: '@react-native/jest-preset',
  // Redux Toolkit, React Redux and their helpers ship as modern ES modules: let Jest translate them too, so slices
  // and hooks can be tested.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@reduxjs/toolkit|immer|redux|react-redux|redux-thunk|reselect)/)',
  ],
};
