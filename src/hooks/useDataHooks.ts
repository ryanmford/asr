import { useState, useEffect, useMemo } from "react";
import { robustSort } from "../lib/asr-utils";

export const useDebounce = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const useFilteredData = <T extends Record<string, unknown> & { searchKey?: string }>(
  source: T[],
  searchTerm: string,
  sortConfig: { key: string; direction: "ascending" | "descending" } | null,
  predicate: ((item: T) => boolean) | null = null,
) => {
  return useMemo(() => {
    if (!source) return [];
    const term = String(searchTerm || "").toLowerCase();
    const processed = source.filter((item) => {
      const matchesSearch = (item?.searchKey || "").includes(term);
      const matchesPredicate = predicate ? predicate(item) : true;
      return matchesSearch && matchesPredicate;
    });
    if (sortConfig && sortConfig.key) {
      const dir = sortConfig.direction === "ascending" ? 1 : -1;
      processed.sort((a, b) => robustSort(a, b, sortConfig.key, dir));
    }
    return processed;
  }, [source, searchTerm, sortConfig, predicate]);
};
