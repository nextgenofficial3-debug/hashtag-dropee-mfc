import React from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Share, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const APK_DOWNLOAD_URL = '/MFC.apk';

const Install: React.FC = () => {
  const navigate = useNavigate();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <div className="text-center space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-3xl font-bold mx-auto">
                M
              </div>
              <h1 className="text-3xl font-bold">Download MFC App</h1>
              <p className="text-muted-foreground">Get the Android app for the best ordering experience.</p>
            </div>

            {/* Android APK Download */}
            {!isIOS && (
              <a href={APK_DOWNLOAD_URL} download>
                <Button size="lg" className="w-full text-base font-bold py-6 shadow-gold-glow" style={{ background: 'linear-gradient(135deg, hsl(var(--brand-gold)) 0%, hsl(35 80% 48%) 100%)', color: 'hsl(0 0% 5%)' }}>
                  <Download className="mr-2 h-5 w-5" /> Download APK
                </Button>
              </a>
            )}

            {/* iOS Fallback */}
            {isIOS && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Smartphone className="h-5 w-5" /> Install on iPhone/iPad</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground list-decimal ml-4">
                    <li>Tap the <Share className="inline h-4 w-4" /> Share button in Safari</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> to install</li>
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* APK Install Instructions */}
            {!isIOS && (
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold">How to install the APK</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal ml-4">
                    <li>Tap <strong>"Download APK"</strong> above</li>
                    <li>Open the downloaded file from your notifications</li>
                    <li>If prompted, allow <strong>"Install from unknown sources"</strong> in Settings</li>
                    <li>Tap <strong>"Install"</strong> and open the app</li>
                  </ol>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
              <div className="p-3 rounded-xl bg-card border border-border/40">
                <p className="text-lg font-bold text-foreground">⚡</p>
                <p className="mt-1">Fast Access</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/40">
                <p className="text-lg font-bold text-foreground">📱</p>
                <p className="mt-1">Native Feel</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/40">
                <p className="text-lg font-bold text-foreground">🔔</p>
                <p className="mt-1">Get Deals</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Install;
