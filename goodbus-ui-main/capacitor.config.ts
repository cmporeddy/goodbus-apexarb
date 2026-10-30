export interface CapacitorConfig {
  appId?: string;
  appName?: string;
  webDir?: string;
  bundledWebRuntime?: boolean;
  server?: {
    url?: string;
    cleartext?: boolean;
    androidScheme?: string;
    iosScheme?: string;
  };
}

const config: CapacitorConfig = {
  appId: 'in.goodbus.app',
  appName: 'GoodBus',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  }
};

export default config;
