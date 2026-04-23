import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/lib/env';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) return;
    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        setIsLoading(false);
        return;
      }

      // Get VAPID public key from the shared Supabase project edge function
      const res = await fetch(
        `https://${env.supabase.projectId}.supabase.co/functions/v1/push-subscribe`,
        { method: 'GET' }
      );
      const { publicKey } = await res.json();

      if (!publicKey) {
        toast.error('Push notification setup not ready');
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });

      // Save subscription to shared backend (mfc_push_subscriptions)
      const saveRes = await fetch(
        `https://${env.supabase.projectId}.supabase.co/functions/v1/push-subscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        }
      );

      if (saveRes.ok) {
        setIsSubscribed(true);
        toast.success('Push notifications enabled! 🔔');
      } else {
        toast.error('Failed to save subscription');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to subscribe';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        await supabase
          .from('mfc_push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }
      setIsSubscribed(false);
      toast.success('Push notifications disabled');
    } catch {
      toast.error('Failed to unsubscribe');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendNotification = useCallback(async (title: string, body: string, orderId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Must be logged in');
        return;
      }

      const res = await fetch(
        `https://${env.supabase.projectId}.supabase.co/functions/v1/send-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ title, body, orderId }),
        }
      );

      const result = await res.json();
      if (res.ok) {
        toast.success(`Notification sent to ${result.sent} subscriber(s)`);
      } else {
        toast.error(result.error || 'Failed to send');
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send notification';
      toast.error(message);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendNotification,
  };
}
