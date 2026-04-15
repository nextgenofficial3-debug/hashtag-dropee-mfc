import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadAppPrompt() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Check if already downloaded/dismissed permanently
    const status = localStorage.getItem("mfc_apk_prompt_status");
    if (status === "completed") return;

    // 2. Check if dismissed in this session
    const sessionHidden = sessionStorage.getItem("mfc_apk_prompt_session_hidden");
    if (sessionHidden === "true") return;

    // 3. Check if coming from Google
    // Note: In local development, the referrer is usually empty.
    // For production, this will detect search arrival.
    const isFromGoogle = document.referrer.toLowerCase().includes("google.com");
    
    // Requirement was specifically "only to those who visit it in google"
    if (isFromGoogle) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000); // 3-second delay to not startle the user
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDownload = () => {
    // Mark as completed so it never shows again
    localStorage.setItem("mfc_apk_prompt_status", "completed");
    setIsOpen(false);
    
    // Trigger download
    const link = document.createElement("a");
    link.href = "/MFC.apk";
    link.download = "MFC.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDismiss = () => {
    // Hide for this session to respect user choice but maybe show again later
    sessionStorage.setItem("mfc_apk_prompt_session_hidden", "true");
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent className="max-w-lg mx-auto border-t-0 bg-transparent pointer-events-none">
        <div className="pointer-events-auto bg-background border-t rounded-t-[32px] px-6 pb-12 pt-4 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
          <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-muted" />
          
          <DrawerHeader className="items-center p-0 mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mb-6 ring-8 ring-primary/5">
               <Download className="w-10 h-10 text-primary" />
            </div>
            <DrawerTitle className="text-2xl font-black text-center uppercase tracking-tight">
              Get the Official App
            </DrawerTitle>
            <DrawerDescription className="text-center text-muted-foreground mt-3 max-w-[280px]">
              Install the MFC native experience for faster ordering and exclusive mobile rewards.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="flex flex-col gap-4 p-0">
            <Button 
              onClick={handleDownload} 
              className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              Download APK Now
            </Button>
            <DrawerClose asChild>
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-xl text-muted-foreground font-medium hover:bg-muted/50" 
                onClick={handleDismiss}
              >
                Continue in Browser
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
