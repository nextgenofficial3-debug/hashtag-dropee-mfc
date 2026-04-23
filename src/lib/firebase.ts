import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { env, hasFirebaseMessagingEnv } from './env';

const firebaseConfig = hasFirebaseMessagingEnv()
  ? {
      apiKey: env.firebase.apiKey!,
      authDomain: env.firebase.authDomain!,
      projectId: env.firebase.projectId!,
      storageBucket: env.firebase.storageBucket!,
      messagingSenderId: env.firebase.messagingSenderId!,
      appId: env.firebase.appId!,
      measurementId: env.firebase.measurementId,
    }
  : null;

const app = firebaseConfig
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;

export { app, getMessaging, getToken, onMessage, isSupported };
