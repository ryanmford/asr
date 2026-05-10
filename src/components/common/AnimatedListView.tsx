/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useMemo, startTransition } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useDebounce } from "../../hooks/useDataHooks";
import { PageHeader } from "../common/PageHeader";
import { ASRSearchInput, ASRDataTable } from "../ASRComponents";
import { ErrorBoundary } from "./ErrorBoundary";

interface AnimatedListViewProps {
  title: string;
  theme: "light" | "dark";
  data: any[];
  searchPlaceholder?: string;
  headerControls?: React.ReactNode;
  isLoading: boolean;
  onItemClick?: (item: any) => void;
  middleLabel?: string;
  columns?: any[];
  viewType?: "card" | "list";
  hideSubtitle?: boolean;
}

export const AnimatedListView = React.memo(({
  title,
  theme,
  data,
  searchPlaceholder,
  headerControls,
  isLoading,
  onItemClick,
  middleLabel,
  columns,
  viewType = "card",
  hideSubtitle = false,
  showVideoColumn = false,
  children,
}: AnimatedListViewProps & { children?: React.ReactNode | ((props: { searchedData: any[] }) => React.ReactNode), showVideoColumn?: boolean }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const searchKey = `q_${title}`;
  const search = searchParams.get("q") || searchParams.get(searchKey) || "";
  
  const setSearch = (val: string) => {
    startTransition(() => {
      setSearchParams(prev => {
        if (val) prev.set(searchKey, val);
        else prev.delete(searchKey);
        return prev;
      }, { replace: true, state: location.state });
    });
  };

  const debouncedSearch = useDebounce(search, 300);

  const searchedData = useMemo(() => {
    const term = String(debouncedSearch || "").toLowerCase();
    if (!term) return data;
    return data.filter((item: any) => item?.isDivider || (item?.searchKey || "").includes(term));
  }, [debouncedSearch, data]);

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title={title} theme={theme}>
        {searchPlaceholder && (
          <ASRSearchInput
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            theme={theme}
            className="flex-1"
          />
        )}
        {headerControls}
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
