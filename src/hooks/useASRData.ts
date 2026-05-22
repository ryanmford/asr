import { useCallback, useEffect, useRef } from "react";
import localforage from "localforage";
import { CONFIG } from "../lib/asr-utils";
import { trackEvent } from "../lib/asr-utils";
import { useDataStore } from "../store/useDataStore";
import { fetchGoogleSheetCSV } from "../lib/asr-data";
import type { ASRDataContext } from "../types";

export let dataWorker: Worker | null = null;
if (typeof Worker !== "undefined") {
  dataWorker = new Worker(new URL("../workers/dataWorker", import.meta.url), {
    type: "module",
  });
}

export const useFetchASRData = () => {
  const setData = useDataStore((s) => s.setData);
  const setFetchStatus = useDataStore((s) => s.setFetchStatus);
  const refreshTrigger = useDataStore((s) => s.refreshTrigger);
  const initialDataConsumed = useRef(false);

  const fetchData = useCallback(
    async (isInitialFetch: boolean = true) => {
      setFetchStatus({ isSyncing: true, hasError: false });
      
      const RAW_CSV_KEY = `${CONFIG.SNAPSHOT_KEY}_raw_csvs`;

      if (isInitialFetch) {
        let restored = false;

        // Stage 1: SSR Data
        if (!initialDataConsumed.current) {
          if (typeof window !== "undefined" && "window" in globalThis && (window as unknown as { __INITIAL_DATA__?: ASRDataContext }).__INITIAL_DATA__) {
            const ssrData = (window as unknown as { __INITIAL_DATA__?: ASRDataContext }).__INITIAL_DATA__!;
            setData({ ...ssrData, isLoading: false });
            initialDataConsumed.current = true;
            restored = true;
          }
        }

        // Stage 2: localforage snapshot storage
        if (!restored) {
          try {
            const cachedSnap = await localforage.getItem(CONFIG.SNAPSHOT_KEY);
            if (cachedSnap) {
              setData({ ...(cachedSnap as ASRDataContext), isLoading: false });
              restored = true;
            }
          } catch (e) {
            console.warn("Failed to retrieve snapshot from localforage:", e);
          }
        }

        // Stage 3: Parsing cached raw sheets
        if (!restored) {
          try {
            const rawCached = await localforage.getItem(RAW_CSV_KEY) as Record<string, string>;
            if (rawCached && rawCached.rM && rawCached.rF && rawCached.rLive && dataWorker) {
              restored = await new Promise<boolean>((resolve) => {
                const handleCacheWorkerMessage = (e: MessageEvent) => {
                  if (e.data.type === "COMPUTE_ALL_READY") {
                    const resultingData = e.data.payload;
                    setData({
                      ...resultingData,
                      isLoading: false,
                    });
                    dataWorker?.removeEventListener("message", handleCacheWorkerMessage);
                    resolve(true);
                  }
                };
                dataWorker?.addEventListener("message", handleCacheWorkerMessage);
                dataWorker?.postMessage({
                  type: "PROCESS_AND_COMPUTE",
                  payload: { ...rawCached, hasTotalError: false, hasPartialError: false },
                });
                // Safe resolution failover
                setTimeout(() => {
                  dataWorker?.removeEventListener("message", handleCacheWorkerMessage);
                  resolve(false);
                }, 5000);
              });
            }
          } catch (e) {
            console.warn("Failed to hydrate cached raw sheets from localforage:", e);
          }
        }

        // Determine final load status and prevent parallel state overlaps
        if (!restored) {
          setFetchStatus({ isLoading: true });
        } else {
          setFetchStatus({ isLoading: false, isSyncing: true });
        }
      }

      const safeFetch = async (gid: string, retries: number = 2) => {
        for (let i = 0; i <= retries; i++) {
          try {
            return await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, gid);
          } catch (e) {
            if (i === retries) {
              console.error(`Final fetch failure for sheet ${gid}:`, e);
              return null;
            }
            await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // Exponential-ish backoff
          }
        }
        return null;
      };

      try {
        const [rM, rF, rLive, rSet] = await Promise.all([
          safeFetch(CONFIG.SHEET_GIDS.MENS),
          safeFetch(CONFIG.SHEET_GIDS.WOMENS),
          safeFetch(CONFIG.SHEET_GIDS.LIVE),
          safeFetch(CONFIG.SHEET_GIDS.SETS),
        ]);

        const hasTotalError = rM === null && rF === null && rLive === null;
        const hasPartialError =
          !hasTotalError &&
          (rM === null || rF === null || rLive === null || rSet === null);

        if (hasTotalError && !isInitialFetch) {
          // If it's a polling retry and totally failed, don't overwrite current state with empty.
          setFetchStatus({ isSyncing: false, hasError: true });
          return;
        }

        if (!hasTotalError) {
          try {
            const oldCsvs = await localforage.getItem(RAW_CSV_KEY) as Record<string, unknown>;
            if (oldCsvs && !isInitialFetch) {
               if (oldCsvs.rM === rM && oldCsvs.rF === rF && oldCsvs.rLive === rLive && oldCsvs.rSet === rSet) {
                  // No change in CSVs, bypass recomputation
                  setFetchStatus({ isSyncing: false });
                  return;
               }
            }
            await localforage.setItem(RAW_CSV_KEY, { rM, rF, rLive, rSet });
          } catch(e) {
            console.warn("Could not cache raw CSVs to localforage.", e);
          }
        }

        // Spin up the worker to do heavy lifting mapping
        if (dataWorker) {
          const handleLiveMapping = async (e: MessageEvent) => {
            if (e.data.type === "COMPUTE_ALL_READY") {
              const resultingData = e.data.payload;
              setData({
                ...resultingData,
                isLoading: false,
              });
              setFetchStatus({ isSyncing: false });
              dataWorker?.removeEventListener("message", handleLiveMapping);
              
              try {
                await localforage.setItem(CONFIG.SNAPSHOT_KEY, resultingData);
              } catch (storageError) {
                console.warn("Could not write cache to localforage.", storageError);
              }
            }
          };

          dataWorker.addEventListener("message", handleLiveMapping);

          dataWorker.postMessage({
            type: "PROCESS_AND_COMPUTE",
            payload: { rM, rF, rLive, rSet, hasTotalError, hasPartialError },
          });
        }
      } catch (e: unknown) {
        let errorMessage = "Unknown Error";
        if (e instanceof Error) errorMessage = e.message;
        
        trackEvent("exception", {
          description: "sheet_fetch_failed",
          error: errorMessage,
          fatal: true,
        });
        setFetchStatus({ isLoading: false, isSyncing: false, hasError: true });
      }
    },
    [setData, setFetchStatus],
  );

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, CONFIG.REFRESH_INTERVAL || 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchData(false);
    }
  }, [refreshTrigger, fetchData]);
};
