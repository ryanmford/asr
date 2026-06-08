/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useMemo, startTransition } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useDebounce } from "../../hooks/useDataHooks";
import { PageHeader } from "../common/PageHeader";
import { ASRSearchInput, ASRDataTable } from "../ASRComponents";
import { ErrorBoundary } from "./ErrorBoundary";
import { normalizeForSearch } from "../../lib/utils";

interface AnimatedListViewProps {
  title: string;
  theme: "light" | "dark";
  data: any[];
  searchPlaceholder?: string;
  searchSubtext?: React.ReactNode;
  headerControls?: React.ReactNode;
  topControls?: React.ReactNode;
  isLoading: boolean;
  onItemClick?: (item: any) => void;
  middleLabel?: string;
  columns?: any[];
  viewType?: "card" | "list";
  hideSubtitle?: boolean;
  hideTitle?: boolean;
  categoryName?: "Players" | "Teams" | "Courses";
}

export const AnimatedListView = React.memo(({
  title,
  theme,
  data,
  searchPlaceholder,
  searchSubtext,
  headerControls,
  topControls,
  isLoading,
  onItemClick,
  middleLabel,
  columns,
  viewType = "card",
  hideSubtitle = false,
  hideTitle = false,
  showVideoColumn = false,
  _categoryName,
  children,
}: AnimatedListViewProps & { children?: React.ReactNode | ((props: { searchedData: any[] }) => React.ReactNode), showVideoColumn?: boolean }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const searchKey = `q_${title}`;
  const search = searchParams.get("q") || searchParams.get(searchKey) || "";
  
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

  const debouncedSearch = useDebounce(search, 300);

  const searchedData = useMemo(() => {
    const term = normalizeForSearch(String(debouncedSearch || ""));
    if (!term) return data;
    const searchTerms = term.split(/[\s,]+/).filter(Boolean);
    return data.filter((item: any) => {
      if (item?.isDivider) return true;
      const key = item?.searchKey || "";
      return searchTerms.every((t: string) => key.includes(t));
    });
  }, [debouncedSearch, data]);

  return (
    <div className="flex flex-col flex-1 w-full max-w-5xl mx-auto">
      <PageHeader title={hideTitle ? undefined : title} theme={theme}>
        {topControls && (
          <div className="flex justify-center w-full">
            {topControls}
          </div>
        )}
        <div className="flex flex-col w-full gap-1">
          <div className="flex w-full gap-2 items-center">
            {searchPlaceholder && (
              <ASRSearchInput
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                theme={theme}
                className="flex-1 w-full"
                enableFocusShortcut="slash"
              />
            )}
            {headerControls}
          </div>
          {searchSubtext && (
            <div>
              {searchSubtext}
            </div>
          )}
        </div>
      </PageHeader>
      
      {children ? (
        typeof children === "function" ? children({ searchedData }) : children
      ) : (
        <ErrorBoundary fallbackMessage="Failed to render the data list.">
          <ASRDataTable
            data={searchedData}
            isLoading={isLoading}
            viewType={viewType as any}
            onItemClick={onItemClick}
            middleLabel={middleLabel}
            columns={columns}
            hideSubtitle={hideSubtitle}
            showVideoColumn={showVideoColumn}
          />
        </ErrorBoundary>
      )}
    </div>
  );
});
