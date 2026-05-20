/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useMemo, startTransition, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { ASRDataTable } from "../ASRComponents";
import { ASRSearchInput } from "../common/ASRSearchInput";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { ASRBottomSheet } from "../common/ASRBottomSheet";
import { CourseData } from "../../types";
import { useDataStore } from "../../store/useDataStore";
import { useAppNavigation, useCourseList } from "../../hooks/useDerivedData";
import { useDebounce } from "../../hooks/useDataHooks";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../lib/asr-utils";
import { normalizeForSearch } from "../../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ASRMap = React.lazy(() => import("../ASRMap").then((m) => ({ default: m.ASRMap })));

export const MapCoursesView = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const isLoading = useDataStore(s => s.isLoading);
  const { navigateToEntity } = useAppNavigation();
  const courseList = useCourseList();

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const searchKey = `q_COURSES`;
  const search = searchParams.get("q") || searchParams.get(searchKey) || "";
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const listRefDesktop = useRef<any>(null);
  const listRefMobile = useRef<any>(null);
  const scrollContainerRefDesktop = React.useRef<HTMLDivElement>(null);
  const scrollContainerRefMobile = React.useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [visibleBounds, setVisibleBounds] = React.useState<any>(null);
  const [snap, setSnap] = React.useState<number>(0.3);
  const containerRef = useRef<HTMLDivElement>(null);
  const setActiveCourseId = useAppStore(s => s.setActiveCourseId);
  const columns = React.useMemo(() => [{ label: "RUNS", key: "totalAllTimeRuns" }], []);
  
  const setSearch = (val: string) => {
    startTransition(() => {
      setSearchParams(prev => {
        if (val) {
          prev.set(searchKey, val);
          prev.delete("q");
        } else {
          prev.delete(searchKey);
          prev.delete("q");
        }
        return prev;
      }, { replace: true, state: location.state });
    });
  };

  const refreshTrigger = useDataStore(s => s.refreshTrigger);
  const prevRefreshTrigger = useRef(refreshTrigger);

  React.useEffect(() => {
    if (refreshTrigger > prevRefreshTrigger.current) {
      prevRefreshTrigger.current = refreshTrigger;
      // Reset view to default when nav dock button is clicked while active
      setSearch("");
      setActiveCourseId(null);
      setSnap(0.3);
      if (mapRef.current?.resetView) {
        mapRef.current.resetView();
      }
      if (scrollContainerRefDesktop.current) {
        scrollContainerRefDesktop.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (scrollContainerRefMobile.current) {
        scrollContainerRefMobile.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [refreshTrigger, setActiveCourseId, setSnap]);

  const debouncedSearch = useDebounce(search, 300);

  const searchedData = useMemo(() => {
    const term = normalizeForSearch(String(debouncedSearch || ""));
    if (!term) return courseList;
    const searchTerms = term.split(/[\s,]+/).filter(Boolean);
    return courseList.filter((item: any) => {
      if (item?.isDivider) return true;
      const key = item?.searchKey || "";
      return searchTerms.every((t: string) => key.includes(t));
    });
  }, [debouncedSearch, courseList]);

  const lastAutoOpenedQueryRef = useRef("");

  React.useEffect(() => {
    if (debouncedSearch && debouncedSearch !== lastAutoOpenedQueryRef.current) {
      const activeCourses = searchedData.filter((c: any) => c && !c.isDivider);
      if (activeCourses.length === 1) {
        lastAutoOpenedQueryRef.current = debouncedSearch;
        setSnap(0.5);
        setActiveCourseId(activeCourses[0].name || null);
      }
    } else if (!debouncedSearch) {
      lastAutoOpenedQueryRef.current = "";
    }
  }, [debouncedSearch, searchedData, setActiveCourseId, setSnap]);

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

  const handlePinClick = React.useCallback((c: CourseData) => {
     setActiveCourseId(c.name || null);
     navigateToEntity("course", c);
  }, [navigateToEntity, setActiveCourseId]);

  const handleMapBackgroundClick = React.useCallback(() => {
     setSnap(0.2);
     setActiveCourseId(null);
  }, [setActiveCourseId]);

  const renderListContent = (currentSnap: number, scrollRef: React.RefObject<HTMLDivElement>, dRef: React.RefObject<any>) => (
    <div className="flex flex-col h-full bg-transparent">
      <div className="px-4 pb-2 pt-2 shrink-0 pointer-events-auto">
        <ASRSearchInput
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          theme={theme}
          placeholder="search courses..."
        />
      </div>
      <div 
        ref={scrollRef}
        onScroll={(e) => {
          if (window.innerWidth < 768) {
            const target = e.target as HTMLDivElement;
            window.dispatchEvent(new CustomEvent("asr-scroll", { detail: { scrollTop: target.scrollTop } }));
          }
        }}
        className="flex-1 px-4 pb-4 pt-0 overflow-y-auto overscroll-none"
        style={{ touchAction: currentSnap >= 0.8 ? 'pan-y' : 'none' }}
      >
        <ErrorBoundary fallbackMessage="Failed to render the data list.">
          <ASRDataTable
            ref={dRef}
            scrollElementRef={scrollRef}
            data={visibleData}
            isLoading={isLoading}
            viewType="card"
            isCompact={true}
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
    <div ref={containerRef} className="relative flex-1 w-full overflow-hidden bg-slate-100 dark:bg-zinc-900">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <React.Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center text-sm font-bold tracking-widest text-zinc-500 animate-pulse">
              LOADING ASR MAP...
            </div>
          }
        >
          <ASRMap
            ref={mapRef}
            courses={searchedData}
            totalCourses={courseList.filter((c: any) => c && !c.isDivider).length}
            searchQuery={debouncedSearch}
            theme={theme}
            onCourseClick={handleItemClick}
            onPinClick={handlePinClick}
            onMapClick={handleMapBackgroundClick}
            onBoundsChange={setVisibleBounds}
            className="w-full h-full rounded-none border-none"
          />
        </React.Suspense>
      </div>

      {/* Desktop Panel (Collapsible Glass Sidebar) */}
      <div 
        className={cn(
          "hidden md:flex flex-col absolute top-4 bottom-4 left-4 z-10 shadow-2xl rounded-3xl overflow-hidden border transition-all duration-500 ease-in-out",
          isSidebarOpen ? "w-[400px] lg:w-[450px]" : "w-[0px] opacity-0 -translate-x-full pointer-events-none",
          theme === "dark" 
            ? "bg-zinc-950/70 border-white/10 backdrop-blur-xl" 
            : "bg-white/70 border-black/10 backdrop-blur-xl"
        )}
      >
        <div className="flex-1 overflow-hidden h-full rounded-3xl">
          {renderListContent(1, scrollContainerRefDesktop, listRefDesktop)}
        </div>
      </div>

      {/* Desktop Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={cn(
          "hidden md:flex absolute top-6 z-20 items-center justify-center w-8 h-12 rounded-r-xl border border-l-0 shadow-lg transition-all duration-500 ease-in-out backdrop-blur-xl hover:bg-opacity-100",
          isSidebarOpen ? "left-[416px] lg:left-[466px]" : "left-0",
          theme === "dark"
            ? "bg-zinc-900/80 border-white/10 text-white hover:bg-zinc-800"
            : "bg-white/80 border-black/10 text-zinc-900 hover:bg-zinc-100"
        )}
      >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Mobile Bottom Sheet */}
      <div className="md:hidden pointer-events-none absolute inset-0 z-50">
        <ASRBottomSheet
          snapPoints={[0.2, 0.5, 0.85]}
          activeSnap={snap as number}
          onSnapChange={setSnap}
        >
          <div className="flex-1 overflow-hidden h-full pt-2">
            {renderListContent(snap as number, scrollContainerRefMobile, listRefMobile)}
          </div>
        </ASRBottomSheet>
      </div>
    </div>
  );
});
