import { useCallback, useEffect, useRef, useState } from 'react';
import { app, getMessaging, getToken, onMessage, isSupported } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { env, hasFirebaseMessagingEnv } from '@/lib/env';
import { toast } from 'sonner';

const APP_NAME = 'mfc';

export function useFCM() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isReady, setIsReady] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setPermission(Notification.permission);
  }, []);

  const saveToken = useCallback(async (token: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // For anonymous/unauthenticated customers, store without user_id
      await supabase.from("fcm_tokens").upsert(
        { token, app: APP_NAME, updated_at: new Date().toISOString() },
        { onConflict: "token" }
      );
      return;
    }
    await supabase.from("fcm_tokens").upsert(
      { user_id: user.id, token, app: APP_NAME, updated_at: new Date().toISOString() },
      { onConflict: "token" }
    );
  }, []);

  const requestPermission = useCallback(async () => {
    if (!hasFirebaseMessagingEnv() || !app || !env.firebase.vapidKey) {
      toast.error('Firebase messaging is not configured for this deployment');
      return null;
    }

    const supported = await isSupported();
    if (!supported) return null;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return null;

      const swParams = new URLSearchParams({
        apiKey: env.firebase.apiKey!,
        authDomain: env.firebase.authDomain!,
        projectId: env.firebase.projectId!,
        storageBucket: env.firebase.storageBucket!,
        messagingSenderId: env.firebase.messagingSenderId!,
        appId: env.firebase.appId!,
      });

      if (env.firebase.measurementId) {
        swParams.set('measurementId', env.firebase.measurementId);
      }

      const swReg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swParams.toString()}`);
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: env.firebase.vapidKey,
        serviceWorkerRegistration: swReg,
      });

      if (token) {
        setFcmToken(token);
        setIsReady(true);
        await saveToken(token);
        toast.success('🔔 You\'ll get notified about your order!');

        unsubscribeRef.current = onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          toast(title || 'MFC Update', {
            description: body || 'Your order status was updated',
            duration: 6000,
          });
        });
      }

      return token;
    } catch (err) {
      console.error('FCM error:', err);
      return null;
    }
  }, [saveToken]);

  const removeToken = useCallback(async () => {
    if (fcmToken) {
      await supabase.from("fcm_tokens").delete().eq("token", fcmToken);
      setFcmToken(null);
      setIsReady(false);
    }
    unsubscribeRef.current?.();
  }, [fcmToken]);

  useEffect(() => {
    if (Notification.permission === 'granted') {
      requestPermission();
    }
    return () => { unsubscribeRef.current?.(); };
  }, [requestPermission]);

  return { fcmToken, permission, isReady, requestPermission, removeToken };
}
