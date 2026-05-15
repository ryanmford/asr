/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useContext, forwardRef, useImperativeHandle } from "react";
import { ChevronsRight, Navigation, Plus, Minus } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { trackEvent, cn } from "../lib/asr-utils";
import { ThemeContext } from "../theme-context";
import { useAppStore } from "../store/useAppStore";

export const ASRMap = forwardRef(({
  courses = [],
  totalCourses = 0,
  searchQuery = "",
  onCourseClick,
  onPinClick,
  onBoundsChange,
  onMapClick,
  theme: propTheme,
  className,
  hideControls = false,
}: any, ref: any) => {
  const contextTheme = useContext(ThemeContext);
  const theme = propTheme || contextTheme;
  const isDark = theme === "dark";

  const activeCourseId = useAppStore(s => s.activeCourseId);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const tileLayersRef = useRef<{ light?: L.TileLayer; dark?: L.TileLayer }>({});
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const fitMapToCourses = React.useCallback(() => {
    if (!mapReady || !mapRef.current || !courses) return;

    const bounds = L.latLngBounds([]);
    let validCoordsCount = 0;
    let lastValidCoord = null;

    courses.forEach((c: any) => {
      if (c.parsedCoords && !c.isDivider) {
        bounds.extend(c.parsedCoords);
        validCoordsCount++;
        lastValidCoord = c.parsedCoords;
      }
    });

    if (validCoordsCount === 1 && lastValidCoord) {
      const isDesktop = window.innerWidth >= 768;
      const panelWidth = window.innerWidth >= 1024 ? 450 : 400;
      const pt = mapRef.current.project(lastValidCoord, 14);
      if (isDesktop) pt.x -= (panelWidth / 2);
      else pt.y += (window.innerHeight * 0.15); // Offset for mobile bottom drawer
      const targetLatLng = mapRef.current.unproject(pt, 14);
      mapRef.current.flyTo(targetLatLng, 14, { duration: 1.5 });
    } else if (validCoordsCount > 1) {
      if (bounds.isValid()) {
        const isDesktop = window.innerWidth >= 768;
        const panelWidth = window.innerWidth >= 1024 ? 450 : 400;
        mapRef.current.fitBounds(bounds, {
          paddingTopLeft: isDesktop ? [panelWidth + 16, 50] : [16, 50],
          paddingBottomRight: isDesktop ? [50, 50] : [16, window.innerHeight * 0.3 + 50],
          maxZoom: 12,
          duration: 1.5,
        });
      }
    } else {
       const isMobile = window.innerWidth < 768;
       const defaultCenter: L.LatLngTuple = isMobile ? [28, -100] : [15, -90];
       const defaultZoom = isMobile ? 2 : 3;
       mapRef.current.flyTo(defaultCenter, defaultZoom, { duration: 1.5 });
    }
  }, [courses, mapReady]);

  const resetViewToDefault = React.useCallback(() => {
    if (!mapReady || !mapRef.current) return;
    const isMobile = window.innerWidth < 768;
    const defaultCenter: L.LatLngTuple = isMobile ? [28, -100] : [15, -90];
    const defaultZoom = isMobile ? 2 : 3;
    mapRef.current.flyTo(defaultCenter, defaultZoom, { duration: 1.0 });
  }, [mapReady]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    locateUser: handleFindMe,
    resetView: resetViewToDefault,
  }));

  const onCourseClickRef = useRef(onCourseClick);
  const onPinClickRef = useRef(onPinClick);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => { onCourseClickRef.current = onCourseClick; }, [onCourseClick]);
  useEffect(() => { onPinClickRef.current = onPinClick; }, [onPinClick]);
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; }, [onBoundsChange]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  // Keep a ref of isDark for the cluster icon creator
  const isDarkRef = useRef(isDark);
  useEffect(() => {
    isDarkRef.current = isDark;
    
    // Attempt to force clusters to redraw to apply the new theme
    if (clusterGroupRef.current) {
        clusterGroupRef.current.refreshClusters();
    }
  }, [isDark]);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const isMobile = window.innerWidth < 768;
    // Set map to focus on Americas and Hawaii on mobile, keep original for desktop
    const defaultCenter: L.LatLngTuple = isMobile ? [28, -100] : [15, -90];
    const defaultZoom = isMobile ? 2 : 3;

    const map = L.map(mapContainerRef.current, {
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
    }).setView(defaultCenter, defaultZoom);

    const lightTile = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const darkTile = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    const lightLayer = L.tileLayer(lightTile, {
      subdomains: "abcd",
      maxZoom: 20,
      className: "transition-opacity duration-[1000ms] ease-in-out",
    }).addTo(map);

    const darkLayer = L.tileLayer(darkTile, {
      subdomains: "abcd",
      maxZoom: 20,
      className: "transition-opacity duration-[1000ms] ease-in-out",
    }).addTo(map);

    lightLayer.setOpacity(isDarkRef.current ? 0 : 1);
    darkLayer.setOpacity(isDarkRef.current ? 1 : 0);
    tileLayersRef.current = { light: lightLayer, dark: darkLayer };

    const getClusterIcon = (cluster: any) => {
      const count = cluster.getChildCount();
      let gradientStyle = "conic-gradient(from 0deg, #3b82f6, #4f46e5, #9333ea, #4f46e5, #3b82f6)";
      if (count > 50) {
        gradientStyle = "conic-gradient(from 0deg, #8b5cf6, #d946ef, #f43f5e, #d946ef, #8b5cf6)";
      }
      if (count > 150) {
        gradientStyle = "conic-gradient(from 0deg, #ef4444, #f43f5e, #e11d48, #f43f5e, #ef4444)";
      }

      const currentIsDark = isDarkRef.current;
      const outerShadow = currentIsDark ? 'shadow-[0_4px_12px_rgba(0,0,0,0.6)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.2)]';
      const innerSurface = currentIsDark 
        ? 'bg-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.8)]' 
        : 'bg-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.1)]';
      const textColor = currentIsDark ? 'text-white' : 'text-zinc-900';

      return L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-full h-full transition-transform duration-300 hover:scale-110 group cursor-pointer ${outerShadow} rounded-full">
            <div class="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
              <div class="absolute top-1/2 left-1/2 w-[400%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
                 <div class="w-full h-full neon-border-rotate opacity-90" style="background: ${gradientStyle};"></div>
              </div>
              <div class="absolute inset-[1.5px] rounded-full z-10 backdrop-blur-md transition-colors ${innerSurface}"></div>
            </div>
            <div class="absolute inset-[3px] rounded-full z-10 transition-colors shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]"></div>
            <span class="relative z-20 ${textColor} font-black text-xs sm:text-sm tracking-tighter drop-shadow-md">
               ${count}
            </span>
          </div>
        `,
        className: "bg-transparent",
        iconSize: [50, 50],
      });
    };

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: false,
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: getClusterIcon,
    });
    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    mapRef.current = map;
    setMapReady(true);

    return () => {
      // Map cleanup
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []); // Run once on mount

  // Map Event Handlers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    
    const handleMapClick = (e: any) => {
      if ((e.originalEvent as any)._markerClicked) return;
      if (onMapClickRef.current) {
        onMapClickRef.current();
      }
    };
    
    const triggerBounds = () => {
      if (onBoundsChangeRef.current) {
         const bounds = map.getBounds();
         onBoundsChangeRef.current({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
         });
      }
    };

    map.on('click', handleMapClick);
    map.on('moveend', triggerBounds);
    triggerBounds();

    return () => {
      map.off('click', handleMapClick);
      map.off('moveend', triggerBounds);
    };
  }, [mapReady]);

  // ResizeObserver for Container
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || !mapRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
         if (entry.target === mapContainerRef.current) {
            requestAnimationFrame(() => {
              if (mapRef.current) {
                mapRef.current.invalidateSize();
              }
            });
         }
      }
    });

    observer.observe(mapContainerRef.current);
    
    return () => {
       observer.disconnect();
    };
  }, [mapReady]);

  // Theme synchronization for Tiles
  useEffect(() => {
    if (!tileLayersRef.current) return;
    const { light, dark } = tileLayersRef.current;
    if (light && dark) {
      if (isDark) {
        dark.setOpacity(1);
        light.setOpacity(0);
      } else {
        light.setOpacity(1);
        dark.setOpacity(0);
      }
    }
  }, [isDark]);

  // Helper to create marker icon
  const createPinIcon = (isActive: boolean) => {
    const currentIsDark = isDarkRef.current;
    const outerShadow = currentIsDark ? 'shadow-[0_4px_12px_rgba(0,0,0,0.6)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.2)]';
    const innerSurface = currentIsDark 
      ? 'bg-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.8)]' 
      : 'bg-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.1)]';

    const activeOuterClasses = isActive ? 'scale-[1.5] z-[1000] brightness-125' : 'hover:scale-[1.15] active:scale-95 drop-shadow-lg';
    
    return L.divIcon({
      html: `
        <div class="asr-pin relative flex flex-col items-center justify-center group transition-all duration-300 cursor-pointer ${activeOuterClasses}" style="width: 44px; height: 44px;">
          <div class="absolute inset-0 bg-transparent"></div>
          <div class="relative flex flex-col items-center mt-2">
            <div class="relative w-6 h-6 rounded-full flex items-center justify-center ${outerShadow}">
              <div class="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                <div class="absolute top-1/2 left-1/2 w-[400%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
                  <div class="w-full h-full neon-border-rotate bg-[conic-gradient(from_0deg,#3b82f6,#4f46e5,#9333ea,#4f46e5,#3b82f6)] opacity-90"></div>
                </div>
                <div class="absolute inset-[1.5px] rounded-full z-10 backdrop-blur-md transition-colors ${innerSurface}"></div>
              </div>
              <div class="relative z-20 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.9)] ${isActive ? 'scale-125' : 'group-hover:scale-125'} transition-all"></div>
            </div>
            <div class="w-[2px] h-[8px] bg-gradient-to-b from-blue-500/80 to-transparent rounded-b-full"></div>
          </div>
        </div>
      `,
      className: "bg-transparent",
      iconSize: [44, 44],
      iconAnchor: [22, 38],
    });
  };

  // Marker Syncing
  useEffect(() => {
    if (!mapReady || !clusterGroupRef.current) return;
    
    const currentCourseIds = new Set(courses.map((c: any) => c.name));
    
    // Remove markers that are no longer in `courses`
    const markersToRemove: L.Marker[] = [];
    for (const [id, marker] of markersRef.current.entries()) {
       if (!currentCourseIds.has(id)) {
          markersToRemove.push(marker);
          markersRef.current.delete(id);
       }
    }

    if (markersToRemove.length > 0) {
       clusterGroupRef.current.removeLayers(markersToRemove);
    }

    // Add or update markers Let's add new markers without blowing up the whole cluster.
    const newMarkers: L.Marker[] = [];

    courses.forEach((c: any) => {
      const id = c.name;
      if (!c.parsedCoords) return;

      const isActive = activeCourseId === id;

      if (!markersRef.current.has(id)) {
         const marker = L.marker(c.parsedCoords, {
            icon: createPinIcon(isActive)
         });

         marker.on("click", (e) => {
            (e.originalEvent as any)._markerClicked = true;
            if (!mapRef.current) return;

            // Intelligent Panning
            const currentZoom = Math.max(mapRef.current.getZoom(), 12);
            const pt = mapRef.current.project(c.parsedCoords, currentZoom);
            const isDesktop = window.innerWidth >= 768;
            
            if (!isDesktop) {
               const targetLatLng = mapRef.current.unproject({ x: pt.x, y: pt.y + (window.innerHeight * 0.22) }, currentZoom);
               mapRef.current.flyTo(targetLatLng, currentZoom, { duration: 1.0 });
            } else {
               const panelWidth = window.innerWidth >= 1024 ? 450 : 400;
               const targetLatLng = mapRef.current.unproject({ x: pt.x - (panelWidth / 2), y: pt.y }, currentZoom);
               mapRef.current.flyTo(targetLatLng, currentZoom, { duration: 1.0 });
            }

            if (onPinClickRef.current) onPinClickRef.current(c);
            else if (onCourseClickRef.current) onCourseClickRef.current(c);
         });

         markersRef.current.set(id, marker);
         newMarkers.push(marker);
      }
    });

    if (newMarkers.length > 0) {
      clusterGroupRef.current.addLayers(newMarkers);
    }

  }, [courses, mapReady]); 

  // Active Pin State AND Theme updates (re-render icons)
  useEffect(() => {
    if (!mapReady) return;
    for (const [id, marker] of markersRef.current.entries()) {
      const isActive = activeCourseId === id;
      marker.setIcon(createPinIcon(isActive));
      
      // Feature: push to top visually
      if (isActive) {
        marker.setZIndexOffset(1000);
      } else {
        marker.setZIndexOffset(0);
      }
    }
  }, [activeCourseId, isDark, mapReady]); // Depends on isDark so markers redraw with theme

  // User Marker theming
  useEffect(() => {
    if (userMarkerRef.current) {
        const currentIsDark = isDarkRef.current;
        userMarkerRef.current.setIcon(L.divIcon({
          html: `
            <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
              <div class="absolute inset-[-60%] bg-blue-500/20 rounded-full" style="will-change: transform; transform: translateZ(0); pointer-events: none;"></div>
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

  const prevSearchQueryRef = useRef(searchQuery);

  // CAMERA DIRECTOR: Automatic Map Framing
  useEffect(() => {
    if (!mapReady || !mapRef.current || !courses) return;

    const activeCoursesCount = courses.filter((c: any) => c && !c.isDivider).length;
    const isFiltered = activeCoursesCount < totalCourses * 0.95 && activeCoursesCount > 0;
    
    // If we're showing all courses (or near all), we don't force recenter.
    // Let the user stay where they are reading the map.
    if (!isFiltered || !searchQuery) {
      prevSearchQueryRef.current = searchQuery;
      return;
    }

    // Only recenter if the actual search query caused this filtering change
    // Don't recenter just because the user toggled the "All Time" / "Open" flag
    if (searchQuery === prevSearchQueryRef.current) {
      return;
    }
    prevSearchQueryRef.current = searchQuery;

    fitMapToCourses();
  }, [courses, totalCourses, mapReady, searchQuery, fitMapToCourses]);

  const handleFindMe = () => {
    if (!mapRef.current || !navigator.geolocation) return;
    setIsLocating(true);
    trackEvent("map_find_me_click", { status: "requested" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mapRef.current) return;
        const { latitude, longitude } = pos.coords;
        mapRef.current.flyTo([latitude, longitude], 13, { duration: 1.5 });
        
        if (userMarkerRef.current) {
           userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
            const currentIsDark = isDarkRef.current;
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: L.divIcon({
                html: `
                  <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
                    <div class="absolute inset-[-60%] bg-blue-500/20 rounded-full" style="will-change: transform; transform: translateZ(0); pointer-events: none;"></div>
                    <div class="relative w-6 h-6 rounded-full flex items-center justify-center bg-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.6)] border-[2.5px] ${currentIsDark ? 'border-zinc-900' : 'border-white'}">
                      <div class="relative w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                `,
                className: "bg-transparent",
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              }),
              interactive: false
           }).addTo(mapRef.current);
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

  return (
    <div
      id="asr-map-container"
      className={cn(
        "relative w-full overflow-hidden shadow-2xl transition-colors duration-500",
        isDark ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" : "",
        className || "h-[60vh] sm:h-[75vh] min-h-[500px] rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-200 dark:border-zinc-800"
      )}
    >
      <div ref={mapContainerRef} className="absolute inset-0 z-[10]" />

      {/* Map Controls - Top Right */}
      <div className="absolute top-4 right-2 sm:right-4 z-[40] flex flex-col gap-3 pointer-events-none">
        {/* Locate Me Button */}
        {!hideControls && (
           <button
              onClick={handleFindMe}
              title="Find my location"
              className={cn(
                "pointer-events-auto p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                isDark
                  ? "bg-black border-zinc-800 text-white hover:bg-zinc-900 focus-visible:ring-offset-[#030303] shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                  : "bg-white border-slate-200 text-black shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-slate-50 theme-focus"
              )}
           >
              <Navigation size={18} strokeWidth={2.5} className={cn(isLocating ? "animate-pulse text-blue-500" : "")} />
           </button>
        )}

        {/* Zoom Controls (Desktop Only) */}
        <div className={cn(
          "pointer-events-auto relative flex flex-col items-center p-0.5 rounded-[2rem] transition-all duration-300 group hidden md:flex",
          isDark ? "shadow-[0_4px_12px_rgba(0,0,0,0.6)]" : "shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
        )}>
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
            <div className="absolute top-1/2 left-1/2 w-[400%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-full h-full neon-border-rotate bg-[conic-gradient(from_0deg,#3b82f6,#4f46e5,#9333ea,#4f46e5,#3b82f6)] opacity-90" />
            </div>
            <div className={cn(
              "absolute inset-[1.5px] rounded-[2rem] z-10 backdrop-blur-md transition-colors",
              isDark ? "bg-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.8)]" : "bg-white shadow-[inset_0_2px_3px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.1)]"
            )} />
          </div>

          <button
            onClick={handleZoomIn}
            className={cn(
              "relative z-20 p-2.5 rounded-t-full transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              isDark ? "text-white hover:bg-white/10" : "text-zinc-900 hover:bg-black/5"
            )}
          >
            <Plus size={18} strokeWidth={2.5}/>
          </button>
          <div className={cn("relative z-20 w-4 h-px my-0.5", isDark ? "bg-white/10" : "bg-black/10")} />
          <button
            onClick={handleZoomOut}
            className={cn(
              "relative z-20 p-2.5 rounded-b-full transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              isDark ? "text-white hover:bg-white/10" : "text-zinc-900 hover:bg-black/5"
            )}
          >
            <Minus size={18} strokeWidth={2.5}/>
          </button>
        </div>
      </div>
    </div>
  );
});
