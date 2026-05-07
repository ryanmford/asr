import React from "react";
import { Map, List } from "lucide-react";
import { ASRNeonToggle } from "../ui/ASRNeonToggle";
import { ASRDataTable } from "../ASRComponents";
import { AnimatedListView } from "../common/AnimatedListView";
import { CourseData } from "../../types";
import { useDataStore } from "../../store/useDataStore";
import { useAppStore } from "../../store/useAppStore";
import { useAppNavigation, useCourseList, useMasterCourseList } from "../../hooks/useDerivedData";

const ASRMap = React.lazy(() => import("../ASRMap").then((m) => ({ default: m.ASRMap })));

export const MapCoursesView = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const isLoading = useDataStore(s => s.isLoading);
  const mapMode = useAppStore(s => s.mapMode);
  const setMapMode = useAppStore(s => s.setMapMode);
  const { navigateToEntity } = useAppNavigation();
  const masterCourseList = useMasterCourseList();
  
  const courseList = useCourseList();

  const handleMapModeChange = React.useCallback((m: string) => {
    setMapMode(m as "map" | "list");
    if (window.scrollY > 150) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [setMapMode]);

  const handleItemClick = React.useCallback((c: CourseData) => {
    navigateToEntity("course", c);
  }, [navigateToEntity]);

  const columns = React.useMemo(() => [{ label: "RUNS", key: "totalAllTimeRuns" }], []);

  const options = React.useMemo(() => [
    { label: <Map size={14} />, value: "map" },
    { label: <List size={14} />, value: "list" },
  ], []);

  return (
    <AnimatedListView
      title="COURSES"
      theme={theme}
      data={courseList}
      searchPlaceholder="search courses..."
      isLoading={isLoading}
      headerControls={
        <ASRNeonToggle
          options={options}
          activeOption={mapMode}
          onChange={handleMapModeChange}
          layoutId="map-mode-pill"
          theme={theme}
          className="w-24 sm:w-32 shrink-0"
        />
      }
    >
      {({ searchedData }: any) =>
        mapMode === "list" ? (
          <ASRDataTable
            data={searchedData}
            isLoading={isLoading}
            viewType="card"
            onItemClick={handleItemClick}
            middleLabel="COURSE"
            columns={columns}
            showVideoColumn={true}
          />
        ) : (
          <div className="px-4 animate-in fade-in duration-300">
            <React.Suspense
              fallback={
                <div className="h-[70vh] w-full flex items-center justify-center text-sm font-bold tracking-widest text-[#2563eb] animate-pulse rounded-2xl bg-zinc-900 border border-zinc-800">
                  LOADING ASR MAP...
                </div>
              }
            >
              <ASRMap
                courses={searchedData}
                totalCourses={masterCourseList.length}
                theme={theme}
                onCourseClick={handleItemClick}
              />
            </React.Suspense>
          </div>
        )
      }
    </AnimatedListView>
  );
});
