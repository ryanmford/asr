 
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useCallback } from "react";
import { useDataStore } from "../store/useDataStore";
import { useAppStore } from "../store/useAppStore";
import {
  useLocation,
  useNavigate,
  useSearchParams,
  useNavigationType,
} from "react-router-dom";
import {
  isQualifiedAthlete,
  isPlaceholderPlayer,
  normalizeName,
} from "../lib/asr-utils";
import { CourseData, SetterProfile, TeamProfile } from "../types";

export const useURLState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const eventType = searchParams.get("eventType") || "open";
  const isAllTimeContext = eventType === "all-time";

  const setEventType = useCallback(
    (nextType: "open" | "all-time") => {
      setSearchParams(
        (prev) => {
          prev.set("eventType", nextType);
          return prev;
        },
        { replace: true, state: location.state },
      );
    },
    [setSearchParams, location.state],
  );

  return {
    eventType,
    isAllTimeContext,
    setEventType,
    searchParams,
    setSearchParams,
  };
};

export const useAppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();

  const currentIdx = location.state?.customIdx || 0;
  const globalMaxIdx = parseInt(sessionStorage.getItem("maxIdx") || "0", 10);

  if (navType === "PUSH") {
    sessionStorage.setItem("maxIdx", currentIdx.toString());
  } else if (currentIdx > globalMaxIdx) {
    sessionStorage.setItem("maxIdx", currentIdx.toString());
  }

  const updatedMaxIdx = parseInt(sessionStorage.getItem("maxIdx") || "0", 10);
  const canGoForward = currentIdx < updatedMaxIdx;

  const goForwardOne = useCallback(() => {
    try {
      navigate(1);
    } catch (e) {
      console.error(e);
    }
  }, [navigate]);

  const prefetchEntity = useCallback(() => {
    // Zero-Latency Hover Prefetching: Eagerly load the inspector chunks
    import("../components/inspector/InspectorBody").catch(() => {});
    import("../components/inspector/PlayerDetails").catch(() => {});
    import("../components/inspector/CourseDetails").catch(() => {});
    import("../components/inspector/TeamDetails").catch(() => {});
  }, []);

  const navigateToEntity = useCallback(
    (type: string, entityData: Record<string, unknown> | string) => {
      try {
        const entityName =
          (entityData as { name?: string })?.name ||
          (entityData as { pKey?: string })?.pKey ||
          (entityData as { label?: string })?.label ||
          (typeof entityData === "string" ? entityData : "");
        if (entityName && typeof entityName === "string") {
          const slug = encodeURIComponent(entityName.trim().toLowerCase());
          let prefix = "players";
          if (type === "course") prefix = "courses";
          if (type === "setter") prefix = "setters";
          if (type === "team") prefix = "teams";

          // We preserve the current search params (like eventType)
          const search = location.search;

          // Navigate to the new path, keeping background state in location.state if possible,
          // or just navigating to the path directly.
          navigate(`/${prefix}/${slug}${search}`, {
            state: {
              backgroundLocation: location,
              customIdx: (location.state?.customIdx || 0) + 1,
            },
            replace: false,
          });
        }
      } catch (e) {
        console.error("Navigation error:", e);
      }
    },
    [navigate, location],
  );

  const closeModals = useCallback(() => {
    try {
      let current = location;
      // Iterate until we find the root location that doesn't have a backgroundLocation
      while (current.state && current.state.backgroundLocation) {
        current = current.state.backgroundLocation;
      }

      let rootPath = current.pathname;
      const segments = rootPath.split("/").filter(Boolean);
      if (
        segments.length > 1 &&
        ["players", "courses", "setters", "teams"].includes(segments[0])
      ) {
        rootPath = `/${segments[0]}`;
      }

      // Navigate to that root location
      navigate(`${rootPath}${current.search}`, { replace: false, state: {} });
    } catch (e) {
      console.error(e);
    }
  }, [navigate, location]);

  const goBackOne = useCallback(() => {
    try {
      const backgroundLocation = location.state?.backgroundLocation;
      if (backgroundLocation) {
        // Manually push/replace to the previous state to avoid iframe history.back() bugs
        navigate(`${backgroundLocation.pathname}${backgroundLocation.search}`, {
          state: backgroundLocation.state,
          replace: true,
        });
      } else {
        closeModals();
      }
    } catch (e) {
      console.error(e);
    }
  }, [navigate, location, closeModals]);

  return {
    navigateToEntity,
    closeModals,
    goBackOne,
    canGoForward,
    goForwardOne,
    prefetchEntity,
  };
};

export const useMasterCourseList = () => {
  return useDataStore((s) => s.masterCourseList);
};

export const useSettersDerived = () => {
  return {
    settersWithImpact: useDataStore((s) => s.settersWithImpact),
    setterMet: useDataStore((s) => s.setterMet),
  };
};

export const usePlayerList = () => {
  const isAllTimeContext = useURLState().isAllTimeContext;
  const gen = useAppStore((s) => s.gen);
  return useDataStore((s) => {
    if (isAllTimeContext) return gen === 'M' ? s.playerList_M_AT : s.playerList_F_AT;
    return gen === 'M' ? s.playerList_M_OP : s.playerList_F_OP;
  }) || [];
};

export const getInspectorDataForPath = (
  pathname: string,
  atMet: Record<string, PlayerProfile>,
  masterCourseList: CourseData[],
  settersWithImpact: SetterProfile[],
) => {
  const pathSegments = pathname.split("/").filter(Boolean);
  const viewPrefix = pathSegments[0];
  const entitySlug = pathSegments[1]
    ? decodeURIComponent(pathSegments[1])
    : null;

  if (!entitySlug) return null;

  if (viewPrefix === "players") {
    const found = Object.values(atMet || {}).find(
      (a: PlayerProfile) =>
        a.name?.toLowerCase() === entitySlug.toLowerCase() ||
        a.pKey === entitySlug.toLowerCase(),
    );
    return {
      type: "player",
      data: found || { name: entitySlug, pKey: entitySlug },
      isNotFound: !found,
      requestedId: entitySlug,
    };
  }
  if (viewPrefix === "courses") {
    const found = masterCourseList.find(
      (c: CourseData) =>
        c.name?.toLowerCase() === entitySlug.toLowerCase() ||
        c.pKey === entitySlug.toLowerCase(),
    );
    return {
      type: "course",
      data: found || { name: entitySlug },
      isNotFound: !found,
      requestedId: entitySlug,
    };
  }
  if (viewPrefix === "setters") {
    const found = settersWithImpact.find(
      (s: SetterProfile) =>
        s.name?.toLowerCase() === entitySlug.toLowerCase() ||
        s.pKey === entitySlug.toLowerCase(),
    );
    return {
      type: "setter",
      data: found || { name: entitySlug },
      isNotFound: !found,
      requestedId: entitySlug,
    };
  }
  if (viewPrefix === "teams") {
    return { type: "team", data: { name: entitySlug } };
  }

  return null;
};

export const useInspectorData = () => {
  const location = useLocation();

  const atMet = useDataStore((s) => s.atMet);
  const masterCourseList = useMasterCourseList();
  const settersWithImpact = useDataStore((s) => s.settersWithImpact);

  return useMemo(() => {
    const history = [];
    let currentLoc: { pathname: string; state?: { backgroundLocation?: unknown } } | null = location;

    while (currentLoc) {
      const data = getInspectorDataForPath(
        currentLoc.pathname,
        atMet,
        masterCourseList,
        settersWithImpact,
      );
      if (data) {
        history.unshift(data);
      }
      if (currentLoc.state && currentLoc.state.backgroundLocation) {
        currentLoc = currentLoc.state.backgroundLocation;
      } else {
        break;
      }
    }

    return {
      current: history.length > 0 ? history[history.length - 1] : null,
      history: history,
      historyIndex: history.length > 0 ? history.length - 1 : -1,
    };
  }, [location, atMet, masterCourseList, settersWithImpact]);
};

export const useCourseList = () => {
  const isAllTimeContext = useURLState().isAllTimeContext;
  return useDataStore((s) => isAllTimeContext ? s.courseList_AT : s.courseList_OP) || [];
};

export const useSettersListOut = () => {
  return useDataStore((s) => s.settersList) || [];
};

export const useTeamList = () => {
  const teamCategory = useAppStore((s) => s.teamCategory);
  const isAllTimeContext = useURLState().isAllTimeContext;
  return useDataStore((s: ASRDataContext) => {
    if (isAllTimeContext) {
      if (teamCategory === 'gyms') return s.teamList_gyms_AT;
      if (teamCategory === 'teams') return s.teamList_teams_AT;
      return [];
    } else {
      if (teamCategory === 'gyms') return s.teamList_gyms_OP;
      if (teamCategory === 'teams') return s.teamList_teams_OP;
      return [];
    }
  }) || [];
};
