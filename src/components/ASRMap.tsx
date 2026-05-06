import React, { useState, useEffect, useRef, useContext } from "react";
import {
  ChevronsRight,
  Navigation,
  Plus,
  Minus
} from "lucide-react";
import { trackEvent, cn } from "../lib/asr-utils";
import { ThemeContext } from "../App";

declare global {
  interface Window {
    L: any;
  }
}

export const ASRMap = ({
  courses = [],
  totalCourses = 0,
  onCourseClick,
  theme: propTheme,
}: any) => {
  const contextTheme = useContext(ThemeContext);
  const theme = propTheme || contextTheme;
  const isDark = theme === "dark";

  const [isScriptsLoaded, setIsScriptsLoaded] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const userMarkerRef = useRef<any>(null);

  const isDarkRef = useRef(isDark);
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  const onCourseClickRef = useRef(onCourseClick);
  useEffect(() => {
    onCourseClickRef.current = onCourseClick;
  }, [onCourseClick]);

  useEffect(() => {
    let isMounted = true;
    
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return;

      const loadStyle = (href: string) => {
        return new Promise((resolve) => {
          if (document.querySelector(`link[href="${href}"]`)) return resolve(true);
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = href;
          link.onload = resolve;
          document.head.appendChild(link);
        });
      };

      const loadScript = (src: string) => {
        return new Promise((resolve) => {
          if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
          const script = document.createElement("script");
          script.src = src;
          script.onload = resolve;
          document.head.appendChild(script);
        });
      };

      try {
        await Promise.all([
          loadStyle("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"),
          loadStyle("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"),
          loadStyle("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css")
        ]);
        
        await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
        if (window.L) {
          await loadScript("https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js");
        }
        
        if (isMounted) setIsScriptsLoaded(true);
      } catch (e) {
        console.error("Failed to load map scripts", e);
      }
    };

    if (window.L && window.L.markerClusterGroup) {
      if (isMounted) setIsScriptsLoaded(true);
    } else {
      loadLeaflet();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isScriptsLoaded || !window.L || !mapContainerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
    }).setView([20, 0], 2);

    const lightTile = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const darkTile = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    tileLayerRef.current = window.L.tileLayer(
      isDark ? darkTile : lightTile,
      {
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    if (window.L.markerClusterGroup) {
      clusterGroupRef.current = window.L.markerClusterGroup({
        chunkedLoading: false,
        maxClusterRadius: 50,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let outerConic = "#3b82f6";
          
          if (count > 50) {
            outerConic = "#a855f7";
          }
          if (count > 200) {
            outerConic = "#f43f5e";
          }

          const currentIsDark = isDarkRef.current;
          const outerShadow = currentIsDark ? 'shadow-[0_4px_12px_rgba(0,0,0,0.6)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.2)]';
          const innerSurface = currentIsDark 
            ? 'bg-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.8)]' 
            : 'bg-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.1)]';
          const textColor = currentIsDark ? 'text-white' : 'text-zinc-900';

          return window.L.divIcon({
            html: `
              <div class="relative flex items-center justify-center w-full h-full transition-transform duration-300 hover:scale-110 group cursor-pointer ${outerShadow} rounded-full">
                <!-- Drop shadow (added to main parent instead for seamless hover effect if needed, but keeping isolated here works too) -->
                <div class="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                  <div class="absolute inset-[-200%] neon-border-rotate z-0 opacity-100 transition-opacity">
                    <div class="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,${outerConic}_180deg,transparent_315deg,transparent_360deg)]"></div>
                  </div>
                  <div class="absolute inset-[1.5px] rounded-full z-10 backdrop-blur-md transition-colors ${innerSurface}"></div>
                </div>

                <!-- cluster color inner glow -->
                <div class="absolute inset-[3px] rounded-full z-10 transition-colors shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]"></div>
                
                <span class="relative z-20 ${textColor} font-black text-xs sm:text-sm tracking-tighter drop-shadow-md">
                   ${count}
                </span>
              </div>
            `,
            className: "bg-transparent",
            iconSize: [42, 42],
          });
        },
      });
      map.addLayer(clusterGroupRef.current);
    }

    mapRef.current = map;
    setMapReady(true);
    
    // Call invalidate multiple times to ensure layout is correct after transition finishes
    const invalidate = () => {
      if (mapRef.current) mapRef.current.invalidateSize();
    };
    setTimeout(invalidate, 100);
    setTimeout(invalidate, 400);
    setTimeout(invalidate, 800);

    window.addEventListener("resize", invalidate);

    return () => {
      window.removeEventListener("resize", invalidate);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, [isScriptsLoaded]);

  // Handle map clicks to dismiss panels/previews
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const mapInstance = mapRef.current;
    
    // Add a flag to prevent map click from immediately hiding the preview
    // if we just clicked a marker.
    const onMapClick = () => {
      if ((window as any)._markerClicked) {
        (window as any)._markerClicked = false;
        return;
      }
    };
    mapInstance.on('click', onMapClick);
    return () => {
       if (mapInstance && mapInstance.off) {
          mapInstance.off('click', onMapClick);
       }
    };
  }, [mapReady]);

  // Watch for container resizes
  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;
    let timeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 100);
    });
    observer.observe(mapContainerRef.current);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [isScriptsLoaded]);

  // Update tiles on theme switch
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const lightTile = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const darkTile = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    tileLayerRef.current.setUrl(isDark ? darkTile : lightTile);
  }, [isDark]);

  // Marker Management
  useEffect(() => {
    if (!mapReady || !mapRef.current || !clusterGroupRef.current || !window.L) return;
    clusterGroupRef.current.clearLayers();

    (courses || []).forEach((c: any) => {
      if (!c.parsedCoords) return;

      const currentIsDark = isDarkRef.current;
      const outerShadow = currentIsDark ? 'shadow-[0_4px_12px_rgba(0,0,0,0.6)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.2)]';
      const innerSurface = currentIsDark 
        ? 'bg-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.8)]' 
        : 'bg-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.1)]';

      const marker = window.L.marker(c.parsedCoords, {
        icon: window.L.divIcon({
          html: `
            <div class="relative flex flex-col items-center group transition-transform duration-300 cursor-pointer hover:scale-[1.15] active:scale-95 drop-shadow-lg" style="width: 24px; height: 32px;">
              <div class="relative w-6 h-6 rounded-full flex items-center justify-center ${outerShadow}">
                <div class="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                  <div class="absolute inset-[-200%] neon-border-rotate z-0 opacity-100 transition-opacity">
                    <div class="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)]"></div>
                  </div>
                  <div class="absolute inset-[1.5px] rounded-full z-10 backdrop-blur-md transition-colors ${innerSurface}"></div>
                </div>
                <div class="relative z-20 w-1.5 h-1.5 ${currentIsDark ? 'bg-blue-400' : 'bg-blue-500'} rounded-full shadow-[0_0_12px_rgba(59,130,246,0.9)] group-hover:scale-125 transition-all"></div>
              </div>
              <div class="w-[2px] h-[8px] ${currentIsDark ? 'bg-gradient-to-b from-blue-400/80 to-transparent' : 'bg-gradient-to-b from-blue-500/80 to-transparent'} rounded-b-full"></div>
            </div>
          `,
          className: "bg-transparent",
          iconSize: [24, 32],
          iconAnchor: [12, 32],
        }),
      });

      marker.on("click", () => {
        (window as any)._markerClicked = true;
        if (!mapRef.current) return;
        
        if (onCourseClickRef.current) {
          onCourseClickRef.current(c);
        }
      });
      clusterGroupRef.current.addLayer(marker);
    });
  }, [courses, isScriptsLoaded, mapReady, isDark]);

  // Update user marker if it exists when theme changes
  useEffect(() => {
    if (userMarkerRef.current && window.L) {
      const currentIsDark = isDark;
          userMarkerRef.current.setIcon(window.L.divIcon({
        html: `
          <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
            <div class="absolute inset-[-100%] bg-blue-500 rounded-full animate-ping opacity-25"></div>
            <div class="relative w-6 h-6 rounded-full flex items-center justify-center bg-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.6)] border-[2.5px] ${currentIsDark ? 'border-zinc-900' : 'border-white'}">
              <div class="relative w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        className: "bg-transparent",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      }));
    }
  }, [isDark]);

  // CAMERA DIRECTOR: Automatic Map Framing
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.L || !courses || !isScriptsLoaded) return;

    if (courses.length === totalCourses || courses.length === 0) {
      if (mapRef.current.getZoom() > 3) {
        mapRef.current.flyTo([20, 0], 2, { duration: 1.5 });
      }
      return;
    }

    const bounds = window.L.latLngBounds();
    let validCoordsCount = 0;
    let lastValidCoord = null;

    courses.forEach((c: any) => {
      if (c.parsedCoords) {
        bounds.extend(c.parsedCoords);
        validCoordsCount++;
        lastValidCoord = c.parsedCoords;
      }
    });

    if (validCoordsCount === 1) {
      mapRef.current.flyTo(lastValidCoord, 14, { duration: 1.5 });
    } else if (validCoordsCount > 1) {
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 12,
          duration: 1.5,
        });
      }
    }
  }, [courses, totalCourses, isScriptsLoaded, mapReady]);

  const handleFindMe = () => {
    if (!mapRef.current || !navigator.geolocation) return;
    setIsLocating(true);
    trackEvent("map_find_me_click", { status: "requested" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mapRef.current) return;
        const { latitude, longitude } = pos.coords;
        mapRef.current.flyTo([latitude, longitude], 13, { duration: 1.5 });
        
        if (window.L) {
          if (userMarkerRef.current) {
             userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
              userMarkerRef.current = window.L.marker([latitude, longitude], {
                icon: window.L.divIcon({
                  html: `
                    <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
                      <div class="absolute inset-[-100%] bg-blue-500 rounded-full animate-ping opacity-25"></div>
                      <div class="relative w-6 h-6 rounded-full flex items-center justify-center bg-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.6)] border-[2.5px] ${isDarkRef.current ? 'border-zinc-900' : 'border-white'}">
                        <div class="relative w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    </div>
                  `,
                  className: "bg-transparent",
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                }),
                interactive: false
             }).addTo(mapRef.current!);
          }
        }

        setIsLocating(false);
        trackEvent("map_find_me_success");
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  if (!isScriptsLoaded) {
    return (
      <div
        className={cn(
          "w-full h-[60vh] sm:h-[75vh] min-h-[500px] flex flex-col items-center justify-center rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl",
          isDark
            ? "bg-zinc-900/40 border-zinc-800 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            : "bg-slate-100 border-slate-200 text-black"
        )}
      >
        <div className="animate-spin opacity-70 mb-4">
          <ChevronsRight
            className="w-6 h-6 text-blue-600"
            strokeWidth={2.5}
            style={{ transform: "skewX(-18deg)" }}
          />
        </div>
        <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] animate-pulse opacity-70">
          ACCESSING ASR MAP SOURCE...
        </div>
      </div>
    );
  }

  return (
    <div
      id="asr-map-container"
      className={cn(
        "relative w-full h-[60vh] sm:h-[75vh] min-h-[500px] rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl border",
        isDark
          ? "border-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          : "border-slate-200"
      )}
    >
      <div ref={mapContainerRef} className="absolute inset-0 z-[10]" />

      {/* Top Left: Find Course Near Me */}
      <div className="absolute top-4 left-4 z-[40] pointer-events-none">
        <div className={cn(
          "pointer-events-auto relative rounded-full transition-all duration-300 flex items-center p-0.5 group",
          isDark 
            ? "shadow-[0_4px_12px_rgba(0,0,0,0.6)]" 
            : "shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
        )}>
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <div className="absolute inset-[-200%] neon-border-rotate z-0 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)]" />
            </div>
            <div className={cn(
              "absolute inset-[1.5px] rounded-full z-10 backdrop-blur-md transition-colors",
              isDark 
                ? "bg-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.8)]" 
                : "bg-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.1)]"
            )} />
          </div>

          <button
            onClick={handleFindMe}
            className="relative z-20 flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Navigation size={14} strokeWidth={2.5} className={cn("text-blue-500", isLocating && "animate-spin")} />
            <span className={isDark ? "text-white" : "text-zinc-900"}>Find Course Near Me</span>
          </button>
        </div>
      </div>

      {/* Top Right: Zoom Controls */}
      <div className="absolute top-4 right-4 z-[40] pointer-events-none">
        <div className={cn(
          "pointer-events-auto relative flex flex-col items-center p-0.5 rounded-full transition-all duration-300 group",
          isDark 
            ? "shadow-[0_4px_12px_rgba(0,0,0,0.6)]" 
            : "shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
        )}>
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <div className="absolute inset-[-200%] neon-border-rotate z-0 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)]" />
            </div>
            <div className={cn(
              "absolute inset-[1.5px] rounded-full z-10 backdrop-blur-md transition-colors",
              isDark 
                ? "bg-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.8)]" 
                : "bg-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.1)]"
            )} />
          </div>

           <button
              onClick={handleZoomIn}
              className={cn(
                "relative z-20 p-2.5 rounded-full transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"
              )}
           >
              <Plus size={18} strokeWidth={2.5}/>
           </button>
           <div className={cn(
             "relative z-20 w-4 h-px my-0.5",
             isDark ? "bg-white/10" : "bg-black/10"
           )} />
           <button
              onClick={handleZoomOut}
              className={cn(
                "relative z-20 p-2.5 rounded-full transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"
              )}
           >
              <Minus size={18} strokeWidth={2.5}/>
           </button>
        </div>
      </div>
    </div>
  );
};
