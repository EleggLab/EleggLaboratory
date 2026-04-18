try {
  process.env.EXPO_ROUTER_APP_ROOT = './app';
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  require('expo-router/entry');
} catch (error) {
  console.error('APP_ENTRY_BOOT_FAILURE', error);
  throw error;
}
