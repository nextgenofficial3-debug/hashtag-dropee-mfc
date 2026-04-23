function readRequiredEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];

  if (!value || value.startsWith("your-")) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name];

  if (!value || value.startsWith("your-")) {
    return undefined;
  }

  return value;
}

export const env = {
  supabase: {
    projectId: readRequiredEnv("VITE_SUPABASE_PROJECT_ID"),
    url: readRequiredEnv("VITE_SUPABASE_URL"),
    publishableKey: readRequiredEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
  },
  firebase: {
    apiKey: readOptionalEnv("VITE_FIREBASE_API_KEY"),
    authDomain: readOptionalEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: readOptionalEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: readOptionalEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readOptionalEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readOptionalEnv("VITE_FIREBASE_APP_ID"),
    measurementId: readOptionalEnv("VITE_FIREBASE_MEASUREMENT_ID"),
    vapidKey: readOptionalEnv("VITE_FIREBASE_VAPID_KEY"),
  },
  googleMapsApiKey: readOptionalEnv("VITE_GOOGLE_MAPS_API_KEY"),
};

export function hasFirebaseMessagingEnv() {
  return Boolean(
    env.firebase.apiKey &&
      env.firebase.authDomain &&
      env.firebase.projectId &&
      env.firebase.storageBucket &&
      env.firebase.messagingSenderId &&
      env.firebase.appId &&
      env.firebase.vapidKey
  );
}
