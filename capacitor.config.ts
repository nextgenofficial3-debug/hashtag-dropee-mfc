import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'studio.mfc.animation',
  appName: 'MFC - Fried Chicken',
  webDir: 'dist',
  server: {
    url: 'https://mfc.discoverukhrul.site',
    cleartext: false,
  },
};

export default config;
