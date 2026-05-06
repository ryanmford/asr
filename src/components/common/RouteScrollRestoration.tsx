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
          window.scrollTo({ top: parseInt(savedScroll, 10), behavior: "instant" });
       }
    } else {
       // Only reset scroll explicitly if the active path+search really changed,
       // and we haven't already restored it. Wait - if we click a top tab, we should scroll up.
       // Actually, react-router doesn't normally scroll up on PUSH. We want to.
       if (locStr !== prevActiveLocStr.current) {
          window.scrollTo({ top: 0, behavior: "instant" });
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
