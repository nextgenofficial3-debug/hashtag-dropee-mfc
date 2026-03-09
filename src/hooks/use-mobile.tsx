import * as React from "react";

const MOBILE_BREAKPOINT = 1024; // Increased from 768 to better detect mobile browsers

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const detectMobile = () => {
      // Check both viewport size and user agent for better mobile detection
      const isSmallViewport = window.innerWidth < MOBILE_BREAKPOINT;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      return isSmallViewport || (isMobileUA && window.innerWidth <= 1200);
    };

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(detectMobile());
    };
    mql.addEventListener("change", onChange);
    setIsMobile(detectMobile());
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
