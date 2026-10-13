import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skylinerisk.audit',
  appName: 'Sky Line Risk Audit Services',
  webDir: 'public',
  server: {
    // Replace with your production deployed HTTPS URL (e.g. 'https://lvms-app.vercel.app')
    // For local testing: 'http://10.0.2.2:3000' (Android Emulator) or 'http://YOUR_LOCAL_IP:3000'
    url: process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#080e1e',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#080e1e',
      showSpinner: false,
    },
  },
};

export default config;
