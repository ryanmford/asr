/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useMemo, startTransition, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { Navigation } from "lucide-react";
import { ASRDataTable, ASRSearchInput } from "../ASRComponents";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { ASRBottomSheet } from "../common/ASRBottomSheet";
import { CourseData } from "../../types";
import { useDataStore } from "../../store/useDataStore";
import { useAppNavigation, useCourseList, useMasterCourseList } from "../../hooks/useDerivedData";
import { useDebounce } from "../../hooks/useDataHooks";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../lib/asr-utils";

const ASRMap = React.lazy(() => import("../ASRMap").then((m) => ({ default: m.ASRMap })));

export const MapCoursesView = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const isLoading = useDataStore(s => s.isLoading);
  const { navigateToEntity } = useAppNavigation();
  const masterCourseList = useMasterCourseList();
  const courseList = useCourseList();

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const searchKey = `q_COURSES`;
  const search = searchParams.get("q") || searchParams.get(searchKey) || "";
  const listRefDesktop = useRef<any>(null);
  const listRefMobile = useRef<any>(null);
  const scrollContainerRefDesktop = React.useRef<HTMLDivElement>(null);
  const scrollContainerRefMobile = React.useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [visibleBounds, setVisibleBounds] = React.useState<any>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  
  const setSearch = (val: string) => {
    startTransition(() => {
      setSearchParams(prev => {
        if (val) prev.set(searchKey, val);
        else prev.delete(searchKey);
        return prev;
      }, { replace: true, state: location.state });
    });
  };

  const handleLocateClick = () => {
    if (mapRef.current?.locateUser) {
      setIsLocating(true);
      mapRef.current.locateUser();
      setTimeout(() => setIsLocating(false), 2000);
    }
  };

  const debouncedSearch = useDebounce(search, 300);

  const searchedData = useMemo(() => {
    const term = String(debouncedSearch || "").toLowerCase();
    if (!term) return courseList;
    return courseList.filter((item: any) => item?.isDivider || (item?.searchKey || "").includes(term));
  }, [debouncedSearch, courseList]);

  const visibleData = useMemo(() => {
    if (!visibleBounds) return searchedData;
    return searchedData.filter((item: any) => {
      if (item?.isDivider) return true;
      if (!item?.parsedCoords) return true;
      const [lat, lng] = item.parsedCoords;
      const latOk = lat >= visibleBounds.south && lat <= visibleBounds.north;
      let lngOk: boolean;
      if (visibleBounds.west <= visibleBounds.east) {
        lngOk = lng >= visibleBounds.west && lng <= visibleBounds.east;
      } else {
        lngOk = lng >= visibleBounds.west || lng <= visibleBounds.east;
      }
      // Add a small buffer to the bounds to ensure items near the edge are shown
      return latOk && lngOk;
    });
  }, [searchedData, visibleBounds]);

  const handleItemClick = React.useCallback((c: CourseData) => {
    navigateToEntity("course", c);
  }, [navigateToEntity]);

  const columns = React.useMemo(() => [{ label: "RUNS", key: "totalAllTimeRuns" }], []);
  const [snap, setSnap] = React.useState<number>(0.3);
  const setActiveCourseId = useAppStore(s => s.setActiveCourseId);

  const handlePinClick = React.useCallback((c: CourseData) => {
     setSnap(0.5);
     // Highlight the pin and list item briefly
     setActiveCourseId(c.name || null);
     const index = visibleData.findIndex((item: any) => item.name === c.name);
     if (index !== -1) {
        setTimeout(() => {
           if (listRefMobile.current && window.innerWidth < 768) {
               listRefMobile.current.scrollToIndex(index, "start");
           } else if (listRefDesktop.current) {
               listRefDesktop.current.scrollToIndex(index, "start");
           }
           setTimeout(() => setActiveCourseId(null), 1500); // clear highlight after short delay
        }, 100);
     } else {
        setTimeout(() => setActiveCourseId(null), 1500);
     }
  }, [visibleData, setActiveCourseId]);

  const handleMapBackgroundClick = React.useCallback(() => {
     setSnap(0.2);
     setActiveCourseId(null);
  }, [setActiveCourseId]);

  const renderListContent = (currentSnap: number, scrollRef: React.RefObject<HTMLDivElement>, dRef: React.RefObject<any>) => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <div 
        ref={scrollRef}
        className="flex-1 px-4 pb-4 pt-4 overflow-y-auto overscroll-contain"
        style={{ touchAction: currentSnap >= 0.85 ? 'pan-y' : 'none' }}
      >
        <ErrorBoundary fallbackMessage="Failed to render the data list.">
          <ASRDataTable
            ref={dRef}
            scrollElementRef={scrollRef}
            data={visibleData}
            isLoading={isLoading}
            viewType="card"
            onItemClick={handleItemClick}
            middleLabel="COURSE"
            columns={columns}
            showVideoColumn={true}
          />
        </ErrorBoundary>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-[calc(100vh-68px)] sm:h-[calc(100vh-76px)] overflow-hidden bg-slate-100 dark:bg-zinc-900">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <React.Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center text-sm font-bold tracking-widest text-[#3b82f6] animate-pulse">
              LOADING ASR MAP...
            </div>
          }
        >
          <ASRMap
            ref={mapRef}
            courses={searchedData}
            totalCourses={masterCourseList.length}
            theme={theme}
            onCourseClick={handleItemClick}
            onPinClick={handlePinClick}
            onMapClick={handleMapBackgroundClick}
            onBoundsChange={setVisibleBounds}
            hideControls={true}
            className="w-full h-full rounded-none border-none"
          />
        </React.Suspense>
      </div>

      {/* Floating Search Pill */}
      <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 md:ml-[208px] lg:ml-[233px] z-[100] w-[90%] max-w-[400px] pointer-events-none drop-shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-auto">
          <ASRSearchInput
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            placeholder="search courses..."
            theme={theme}
            variant="pill"
            rightElement={
              <button
                onClick={handleLocateClick}
                className={cn(
                  "min-w-[40px] min-h-[40px] flex items-center justify-center rounded-[2rem] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95",
                  theme === "dark" ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"
                )}
                title="Find my location"
              >
                <div className={cn("flex items-center justify-center w-8 h-8 rounded-full", theme === "dark" ? "bg-white/10" : "bg-black/5")}>
                  <Navigation size={16} strokeWidth={2.5} className={cn(isLocating ? "animate-pulse text-blue-500" : "")} />
                </div>
              </button>
            }
          />
        </div>
      </div>

      {/* Desktop Panel */}
      <div className="hidden md:flex flex-col absolute top-4 bottom-4 left-4 w-[400px] lg:w-[450px] z-10 shadow-2xl rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950">
        {renderListContent(1, scrollContainerRefDesktop, listRefDesktop)}
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="md:hidden pointer-events-none absolute inset-0 z-50">
        <ASRBottomSheet
          snapPoints={[0.2, 0.5, 0.9]}
          activeSnap={snap as number}
          onSnapChange={setSnap}
        >
          <div className="flex-1 overflow-hidden h-[90vh]">
            {renderListContent(snap as number, scrollContainerRefMobile, listRefMobile)}
          </div>
        </ASRBottomSheet>
      </div>
    </div>
  );
});
