import React, { useContext } from "react";
import { Search, CloudOff } from "lucide-react";
import { cn } from "../../lib/asr-utils";
import { ThemeContext } from "../../theme-context";
import { ASRListItem } from "../ASRListItems";
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from "../../store/useDataStore";
import { useAppStore } from "../../store/useAppStore";
import { useAppNavigation } from "../../hooks/useDerivedData";

interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  type?: string;
  isRank?: boolean;
  color?: string;
  width?: string;
  getValue?: (item: T) => React.ReactNode;
}

interface ASRDataTableProps<T = Record<string, unknown>> {
 data: T[];
 columns: ColumnDef<T>[];
 viewType?: "table" | "card";
 isCompact?: boolean;
 onItemClick?: (item: T) => void;
 emptyMessage?: string;
 isLoading?: boolean;
 visibleCount?: number;
 observerTarget?: React.RefObject<HTMLDivElement> | null;
 scrollElementRef?: React.RefObject<HTMLElement | null>;
 showRankings?: boolean;
 hideSubtitle?: boolean;
 middleLabel?: string;
 showVideoColumn?: boolean;
}

interface MemoizedVirtualRowProps<T> {
  virtualRow: import("@tanstack/react-virtual").VirtualItem;
  item: T & { isDivider?: boolean; rank?: number; name?: string; pKey?: string; id?: string };
  viewType: "table" | "card";
  isCompact?: boolean;
  statColumns: ColumnDef<T>[];
  columns: ColumnDef<T>[];
  showVideoColumn: boolean;
  onItemClick?: (item: T) => void;
  onItemHover?: (item: T, isHovering: boolean) => void;
  activeCourseId?: string | null;
  measureElement: (node: Element | null) => void;
}

const MemoizedVirtualRow = React.memo(({
  virtualRow,
  item,
  viewType,
  isCompact,
  statColumns,
  columns,
  showVideoColumn,
  onItemClick,
  onItemHover,
  activeCourseId,
  measureElement
}: MemoizedVirtualRowProps<Record<string, unknown>>) => {
  const absoluteTransform = `translateY(${virtualRow.start}px)`;

  const stats = React.useMemo(() => {
    if (!item) return [];
    return statColumns.map((c) => ({
      value: typeof c.getValue === "function" ? c.getValue(item) : item[c.key as keyof typeof item],
      color: c.color,
      label: c.label,
    }));
  }, [statColumns, item]);

  const handleClick = React.useCallback(() => {
    if (onItemClick) onItemClick(item);
  }, [onItemClick, item]);

  if (!item) return null;

  if (item.isDivider) {
    return (
      <div
        data-index={virtualRow.index}
        ref={measureElement}
        style={{
          position: "absolute",
          top: 0, left: 0, width: "100%", transform: absoluteTransform,
        }}
        className={cn(
          "flex items-center gap-4 py-8 px-4",
          viewType === "card" ? "col-span-full" : "",
        )}
      >
        <div className="h-[1px] flex-1 bg-zinc-800/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] theme-text-muted">
          {item.label}
        </span>
        <div className="h-[1px] flex-1 bg-zinc-800/20" />
      </div>
    );
  }

  return (
    <div
      data-index={virtualRow.index}
      ref={measureElement}
      style={{
        position: "absolute",
        top: 0, left: 0, width: "100%", transform: absoluteTransform,
      }}
      className={cn("w-full px-4", viewType === "card" && "pb-3")}
    >
      <ASRListItem
        variant={viewType}
        isCompact={isCompact}
        rank={item.currentRank}
        title={item.name}
        subtitle={null}
        flag={item.region || item.flag || item.country}
        stats={stats}
        videoUrl={item.videoUrl || item.demoVideo}
        mapUrl={item.mapUrl}
        columns={columns}
        shouldFade={item.shouldFade}
        badgeContent={item.badgeContent}
        onClick={handleClick}
        onHover={(isHovering) => onItemHover && onItemHover(item, isHovering)}
        isHighlighted={!!(activeCourseId && (item.id === activeCourseId || item.pKey === activeCourseId || item.name === activeCourseId))}
        showVideoIcon={showVideoColumn}
      />
    </div>
  );
});

export interface ASRDataTableRef {
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void;
}

export const ASRDataTable = React.memo(
 React.forwardRef<ASRDataTableRef, ASRDataTableProps>(({
 data,
 columns = [],
 viewType = "table",
 isCompact = false,
 onItemClick,
 isLoading = false,
 showRankings = true,
 middleLabel = "PLAYER / DATA",
 showVideoColumn = false,
 scrollElementRef,
 }, ref) => {
 const theme = useContext(ThemeContext);
 const hasError = useDataStore(s => s.hasError);
 const { prefetchEntity } = useAppNavigation();
 const activeCourseId = useAppStore(s => s.activeCourseId);
 const setActiveCourseId = useAppStore(s => s.setActiveCourseId);

 const handleItemHover = React.useCallback((item: Record<string, unknown>, isHovering: boolean) => {
   if (isHovering) {
     prefetchEntity(item);
     setActiveCourseId((item?.id as string) || (item?.pKey as string) || null);
   } else {
     setActiveCourseId(null);
   }
 }, [prefetchEntity, setActiveCourseId]);
 
 const estimateSize = React.useCallback(() => {
   return viewType === "card" 
     ? (isCompact ? 76 : window.innerWidth >= 1024 ? 120 : window.innerWidth >= 640 ? 100 : 100) 
     : (window.innerWidth >= 1024 ? 80 : 64);
 }, [viewType, isCompact]);

 const windowVirtualizer = useWindowVirtualizer({
 count: !scrollElementRef ? (data?.length || 0) : 0,
 estimateSize,
 overscan: 5,
 getItemKey: (index) => `${data[index]?.id || data[index]?.pKey || data[index]?.name || 'item'}_${index}`,
 });

 const [isElementReady, setIsElementReady] = React.useState(false);
 React.useEffect(() => {
   if (scrollElementRef?.current) {
     setIsElementReady(true);
   }
 }, [scrollElementRef?.current]);

 const elementVirtualizer = useVirtualizer({
   count: scrollElementRef && isElementReady ? (data?.length || 0) : 0,
   getScrollElement: () => scrollElementRef?.current || null,
   estimateSize,
   overscan: 5,
   getItemKey: (index) => `${data[index]?.id || data[index]?.pKey || data[index]?.name || 'item'}_${index}`,
 });

 const virtualizer = scrollElementRef ? elementVirtualizer : windowVirtualizer;

 React.useImperativeHandle(ref, () => ({
   scrollToIndex: (index, align = 'center') => {
     virtualizer.scrollToIndex(index, { align });
   }
 }), [virtualizer]);

 const statColumns = React.useMemo(() => columns.filter((c) => !c.isRank && c.type !== "profile"), [columns]);

 if (isLoading) {
  return (
    <div className="flex flex-col w-full px-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-32">
      <div className="flex flex-col gap-3 max-w-7xl mx-auto w-full">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={cn(
              "h-[76px] sm:h-[96px] lg:h-[116px] w-full rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border flex items-center px-4 gap-5 relative overflow-hidden isolate",
              theme === "dark"
                ? "bg-white/[0.02] border-white/[0.04]"
                : "bg-black/[0.02] border-black/[0.04]"
            )}
          >
            {/* Shimmer effect */}
            <div 
              className={cn(
                "absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]",
                theme === "dark" 
                  ? "bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" 
                  : "bg-gradient-to-r from-transparent via-black/[0.04] to-transparent"
              )}
            />
            
            {/* Avatar Skeleton */}
            <div className="flex items-center gap-4 w-[200px] shrink-0 opacity-80">
              <div
                className={cn(
                  "w-10 h-10 rounded-full shrink-0 relative overflow-hidden",
                  theme === "dark" ? "bg-white/[0.05]" : "bg-black/[0.05]"
                )}
              />
              
              <div className="flex flex-col gap-2 flex-1">
                <div
                  className={cn(
                    "h-3 w-28 rounded-full",
                    theme === "dark" ? "bg-white/[0.08]" : "bg-black/[0.08]"
                  )}
                />
                <div
                  className={cn(
                    "h-2 w-16 rounded-full",
                    theme === "dark" ? "bg-white/[0.04]" : "bg-black/[0.04]"
                  )}
                />
              </div>
            </div>

            {/* Data Columns Skeletons */}
            <div className="flex-1 flex justify-end gap-12 pr-6 hidden sm:flex opacity-60">
              {[1, 2, 3].map((col) => (
                <div key={col} className="flex flex-col gap-2 items-end">
                  <div
                    className={cn(
                      "h-3 rounded-full",
                      col === 1 ? "w-12" : col === 2 ? "w-16" : "w-10",
                      theme === "dark" ? "bg-white/[0.06]" : "bg-black/[0.06]"
                    )}
                  />
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      col === 1 ? "w-8" : col === 2 ? "w-10" : "w-14",
                      theme === "dark" ? "bg-white/[0.03]" : "bg-black/[0.03]"
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
 }

 if (!data || data.length === 0) {
 if (hasError) {
 return (
 <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center animate-in fade-in duration-700 min-h-[50vh]">
 <div
 className={cn(
 "p-8 sm:p-12 w-full max-w-sm rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center gap-4 transition-colors",
 theme === "dark"
 ? "border-red-900/30 bg-red-950/20"
 : "border-red-200 bg-red-50/50",
 )}
 >
 <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-1", theme === "dark" ? "bg-red-500/10" : "bg-red-500/10")}>
 <CloudOff size={24} className="text-red-500" />
 </div>
 <h3 className={cn("text-lg sm:text-xl font-black uppercase tracking-widest", theme === "dark" ? "text-red-400" : "text-red-600")}>
 NETWORK ERROR
 </h3>
 <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 px-2 line-clamp-2", theme === "dark" ? "text-red-400" : "text-red-600")}>
 WE COULDN'T CONNECT TO THE ASSETS SERVER.
 </p>
 </div>
 </div>
 );
 }

 return (
 <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center animate-in fade-in duration-700 min-h-[50vh]">
 <div
 className={cn(
 "p-8 sm:p-12 w-full max-w-sm rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center gap-4 transition-colors",
 "theme-panel",
 )}
 >
 <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-1", "bg-black/5 dark:bg-white/5")}>
 <Search size={24} className={"theme-text-faint"} />
 </div>
 <h3 className={cn("text-lg sm:text-xl font-black uppercase tracking-widest", "theme-text-base")}>
 NO RECORDS FOUND
 </h3>
 <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 px-2 line-clamp-2", "theme-text-muted")}>
 TRY ADJUSTING YOUR FILTERS OR SEARCH TERM.
 </p>
 </div>
 </div>
 );
 }

 return (
 <div className="flex flex-col w-full pb-32">
 {showRankings && (
 <div
 className={cn(
 "flex items-center text-[8px] sm:text-[10px] lg:text-[13px] font-black uppercase tracking-widest pt-4 pb-2 select-none border-b border-black/5 mb-2",
 theme === "dark"
 ? "opacity-30 text-white border-white/5"
 : "opacity-50 text-zinc-900 border-black/5",
 viewType === "card" ? "pl-4 sm:pl-5 lg:pl-6 pr-4 sm:pr-5 lg:pr-6 mx-4" : "mx-4",
 )}
 >
 {viewType === "card" ? (
          <div className="flex items-center min-w-0 pr-1 flex-1 gap-2 sm:gap-4 lg:gap-6">
            <div className="w-10 sm:w-16 lg:w-20 shrink-0 flex items-center justify-center text-center">RANK</div>
            <div className="flex flex-col min-w-0 flex-1 text-left">{middleLabel}</div>
          </div>
        ) : (
          <>
            <div className="w-16 sm:w-24 lg:w-32 pl-3 sm:pl-10 lg:pl-12 text-center shrink-0">RANK</div>
            <div className="flex-1 pl-2 sm:pl-8 lg:pl-10 pr-2 text-left">{middleLabel}</div>
          </>
        )}
 <div
 className={cn(
 "flex items-center",
 viewType === "card" ? "gap-2 sm:gap-4" : "gap-0",
 )}
 >
 {statColumns.map((c, i: number) => (
 <div
 key={i}
 className={cn(
   "flex justify-end text-right shrink-0",
   c.width ? c.width : viewType === "card" ? "min-w-[50px] sm:min-w-[80px] lg:min-w-[120px]" : "w-20 sm:w-24 lg:w-32 px-1 sm:px-4 lg:px-6"
 )}
 >
 {c.label}
 </div>
 ))}
 {showVideoColumn && <div className={cn("shrink-0", viewType === "card" ? "w-10 sm:w-12 ml-2 sm:ml-3" : "w-10 sm:w-16 lg:w-20 pr-4 sm:pr-6 lg:pr-8 ml-2")} />}
 </div>
 </div>
 )}

 <div
 style={{ width: "100%", position: "relative", height: virtualizer.getTotalSize() }}
 className="px-4"
 >
 {virtualizer.getVirtualItems().map((virtualRow) => {
 const item = data[virtualRow.index];
 return (
   <MemoizedVirtualRow
     key={virtualRow.key}
     virtualRow={virtualRow}
     item={item}
     viewType={viewType}
     isCompact={isCompact}
     statColumns={statColumns}
     columns={columns}
     showVideoColumn={showVideoColumn}
     onItemClick={onItemClick}
     onItemHover={handleItemHover}
     activeCourseId={activeCourseId}
     measureElement={virtualizer.measureElement}
   />
 );
 })}
 </div>
 </div>
 );
 }),
);
