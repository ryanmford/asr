import { useCallback, useEffect, useRef } from "react";
import localforage from "localforage";
import { CONFIG } from "../lib/asr-utils";
import { trackEvent } from "../lib/asr-utils";
import { useDataStore } from "../store/useDataStore";

let dataWorker: Worker | null = null;
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
      
      if (isInitialFetch && !initialDataConsumed.current) {
        if (typeof window !== 'undefined' && 'window' in globalThis && (window as unknown as { __INITIAL_DATA__?: ASRDataContext }).__INITIAL_DATA__) {
           
           setData((window as unknown as { __INITIAL_DATA__?: ASRDataContext }).__INITIAL_DATA__!);
           initialDataConsumed.current = true;
           setFetchStatus({ isSyncing: false, hasError: false });
           return;
        }
      }

      const RAW_CSV_KEY = `${CONFIG.SNAPSHOT_KEY}_raw_csvs`;

      if (isInitialFetch) {
        try {
          const cached = await localforage.getItem(CONFIG.SNAPSHOT_KEY);
          if (cached) {
            setData({ ...(cached as ASRDataContext), isLoading: false });
          } else {
            // Check for raw cached CSVs
            const rawCached = await localforage.getItem(RAW_CSV_KEY) as Record<string, string>;
            if (rawCached && rawCached.rM && rawCached.rF && rawCached.rLive && dataWorker) {
               dataWorker.postMessage({
                 type: "PROCESS_AND_COMPUTE",
                 payload: { ...rawCached, hasTotalError: false, hasPartialError: false },
               });
            } else {
              const localCached = localStorage.getItem(CONFIG.SNAPSHOT_KEY);
              if (localCached) {
                const parsedLocal = JSON.parse(localCached);
                setData({ ...parsedLocal, isLoading: false });
                try {
                  await localforage.setItem(CONFIG.SNAPSHOT_KEY, parsedLocal);
                } catch (e) {
                  console.warn("Could not write cache to localforage.", e);
                }
              }
            }
          }
        } catch {
          console.warn("Cache recovery fail-safe.");
        }
      }

      const cacheBucket = Math.floor(Date.now() / CONFIG.REFRESH_INTERVAL);
      const getProxyUrlApi = (gid: string) => `/api/proxy-sheet?gid=${gid}&cb=${cacheBucket}`;
      const getProxyUrlDirect = (gid: string) => {
        const spreadsheetId = CONFIG.SPREADSHEET_ID;
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}&cb=${cacheBucket}`;
      };

      const safeFetch = async (gid: string, retries: number = 2) => {
        for (let i = 0; i <= retries; i++) {
          try {
            // Try direct google sheets first for speed, it works 95% of the time.
            // If it fails (CORS in PWA, adblockers, tracking prevention), we fall back to our API.
            let res = await fetch(getProxyUrlDirect(gid)).catch(() => null);
            
            // If fetch threw (network error/CORS), or gave a bad status, fallback to local proxy.
            if (!res || !res.ok) {
              res = await fetch(getProxyUrlApi(gid));
            }
            
            if (!res || !res.ok) throw new Error(`HTTP ${res?.status}`);
            return await res.text();
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
            await localforage.setItem(RAW_CSV_KEY, { rM, rF, rLive, rSet });
          } catch(e) {
            console.warn("Could not cache raw CSVs to localforage.", e);
          }
        }

        // Spin up the worker to do heavy lifting mapping
        if (dataWorker) {
          dataWorker.onmessage = async (e) => {
            if (e.data.type === "COMPUTE_ALL_READY") {
              const resultingData = e.data.payload;
              setData({
                ...resultingData,
                isLoading: false,
              });
              setFetchStatus({ isSyncing: false });
              
              try {
                await localforage.setItem(CONFIG.SNAPSHOT_KEY, resultingData);
              } catch (storageError) {
                console.warn("Could not write cache to localforage.", storageError);
              }
            }
          };

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
