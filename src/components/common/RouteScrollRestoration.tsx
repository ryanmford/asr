import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export function RouteScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();
  const prevActiveLocStr = useRef<string | null>(null);

  useLayoutEffect(() => {
    // Only look at the root location pathname to determine page changes
    let activeLoc = location;
    while (activeLoc.state?.backgroundLocation) {
      activeLoc = activeLoc.state.backgroundLocation;
    }
    
    // Ignore updates to the active loc that are just search param changes
    const locStr = activeLoc.pathname + activeLoc.search;
    
    if (navType === "POP") {
       const savedScroll = sessionStorage.getItem(`scroll-${activeLoc.key}`);
       if (savedScroll) {
          const targetY = parseInt(savedScroll, 10);
          
          const attemptScroll = () => {
             window.scrollTo({ top: targetY, behavior: "instant" });
          };
          
          attemptScroll();
          // Retry slightly later to accommodate Suspense/images loading
          requestAnimationFrame(() => {
             attemptScroll();
             setTimeout(attemptScroll, 100);
          });
       }
    } else {
       if (locStr !== prevActiveLocStr.current) {
          // New page, scroll to top
          window.scrollTo({ top: 0, behavior: "instant" });
          requestAnimationFrame(() => {
             window.scrollTo({ top: 0, behavior: "instant" });
          });
       }
    }
    
    prevActiveLocStr.current = locStr;
    
  }, [location.key, navType, location]);

  useEffect(() => {
    let activeLoc = location;
    while (activeLoc.state?.backgroundLocation) {
      activeLoc = activeLoc.state.backgroundLocation;
    }
    const key = activeLoc.key;
    const handleScroll = () => {
      sessionStorage.setItem(`scroll-${key}`, window.scrollY.toString());
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location]);

  return null;
}
