import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.goodbus.app',
  appName: 'GoodBus',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // When developing live or connecting directly to the sovereign server:
    androidScheme: 'https',
    iosScheme: 'https'
  }
};

export default config;
