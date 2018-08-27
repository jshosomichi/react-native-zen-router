module.exports = {
  get Router() {
    return require('./dist/Router').Router;
  },

  get createGenericScreen() {
    return require('./dist/screens/GenericScreen').createGenericScreen;
  },

  get createTabScreen() {
    return require('./dist/screens/TabScreen').createTabScreen;
  },

};