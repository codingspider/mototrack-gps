// A small in-memory AsyncStorage for the tests (the real one needs the phone's native module).
let store = {};

export default {
  getItem: async (key) => (key in store ? store[key] : null),
  setItem: async (key, value) => {
    store[key] = String(value);
  },
  removeItem: async (key) => {
    delete store[key];
  },
  clear: async () => {
    store = {};
  },
};
