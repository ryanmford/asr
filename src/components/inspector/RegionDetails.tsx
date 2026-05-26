import React, { useMemo, useState } from "react";
import { cn, formatLocation, normalizeName } from "../../lib/asr-utils";
import { ASRStatCard } from "../common/ASRStatCard";
import { FallbackAvatar } from "../common/FallbackAvatar";
import { ProfileHeader, InspectorTabContainer } from "./InspectorComponents";
import { ASRRankList } from "../list/ASRRankList";

import { ASRNeonToggle } from "../common/ASRNeonToggle";
import { ASREmptyState } from "../common/ASREmptyState";
import { useDataStore } from "../../store/useDataStore";

import { ASRDataContext, PlayerProfile } from "../../types";

interface RegionDetailsProps {
  region: { name: string; flag?: string };
  dataContext: ASRDataContext;
  onEntityClick: (type: string, data: Record<string, unknown> | string | { name?: string; pKey?: string }) => void;
  theme: "light" | "dark";
}

export const RegionDetails = React.memo(
  ({ region, dataContext, onEntityClick, theme }: RegionDetailsProps) => {
    const { atMet = {} } = dataContext || {};

    const playerList_M_AT = useDataStore((s) => s.playerList_M_AT);
    const playerList_F_AT = useDataStore((s) => s.playerList_F_AT);

    const allTimeRankedPKeys = useMemo(() => {
      const pKeys = new Set<string>();
      [...(playerList_M_AT || []), ...(playerList_F_AT || [])].forEach((p: any) => {
        if (p.currentRank !== "UR" && !p.isDivider) {
          pKeys.add(p.pKey || normalizeName(p.name));
        }
      });
      return pKeys;
    }, [playerList_M_AT, playerList_F_AT]);

    const [activeTab, setActiveTab] = useState("players");

    const regionNameUpper = region.name.toUpperCase().replace(/[\uD83C][\uDDE6-\uDDFF]|\p{Extended_Pictographic}/gu, '').trim();
    const targetTokens = regionNameUpper.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    const isTokenMatch = (objTokens: string[]): boolean => {
      if (!objTokens || objTokens.length === 0) return false;
      
      if (objTokens.length >= targetTokens.length) {
        // Object provides as much or more detail as region. 
        // All region requirements must be satisfied by object.
        return targetTokens.every(t => objTokens.includes(t));
      } else {
        // Object provides less detail than region (e.g. missing state).
        // It must be referring to the same specific place (tokens[0] === targetTokens[0])
        // And have no conflicts (all tokens are in targetTokens).
        return objTokens[0] === targetTokens[0] && objTokens.every(t => targetTokens.includes(t));
      }
    };

    const matchRegion = (obj: any): boolean => {
      const locStr = formatLocation(obj);
      if (!locStr || locStr === "UNKNOWN") return false;
      const strippedLocStr = locStr.replace(/[\uD83C][\uDDE6-\uDDFF]|\p{Extended_Pictographic}/gu, '').trim();

      const objTokens = strippedLocStr.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

      if (isTokenMatch(objTokens)) {
         return true;
      }
      
      const rawValues = [
        obj.city, obj.country, obj.state, obj.stateProv, obj.location, obj.region, obj.teamLocation, obj.homeGym
      ].filter(Boolean).map(v => String(v).toUpperCase().replace(/[\uD83C][\uDDE6-\uDDFF]|\p{Extended_Pictographic}/gu, '').trim());
      
      if (Array.isArray(obj.teams)) {
          obj.teams.forEach((t: any) => {
              if (t.location) rawValues.push(String(t.location).toUpperCase().replace(/[\uD83C][\uDDE6-\uDDFF]|\p{Extended_Pictographic}/gu, '').trim());
          });
      }
      
      for (const rv of rawValues) {
          const rvTokens = rv.split(',').map(s => s.trim()).filter(Boolean);
          if (isTokenMatch(rvTokens)) {
              return true;
          }
      }

      return false;
    };

    const regionalCourses = useMemo(() => {
      const allCourses = (dataContext.masterCourseList || []) as any[];
      return allCourses
        .filter(matchRegion)
        .map(c => ({
          ...c,
          runs: c.totalAllTimeRuns || c.totalRuns || 0,
          pKey: normalizeName(c.name)
        }))
        .sort((a, b) => (b.runs) - (a.runs));
    }, [dataContext.masterCourseList, region]);

    const regionalPlayers = useMemo(() => {
      const regionStats: Record<string, { runs: number; lqSum: number }> = {};

      regionalCourses.forEach((c) => {
        const mRecord = c.allTimeMRecord || c.mRecord;
        const fRecord = c.allTimeFRecord || c.fRecord;

        const mMAll = c.allTimeAthletesM || c.athletesMAll;
        if (Array.isArray(mMAll) && mRecord) {
          mMAll.forEach((a: any) => {
            if (a && a[0]) {
              const pKey = normalizeName(a[0]);
              if (!regionStats[pKey]) regionStats[pKey] = { runs: 0, lqSum: 0 };
              regionStats[pKey].runs += 1;
              regionStats[pKey].lqSum += (mRecord / a[1]) * 100;
            }
          });
        }

        const fFAll = c.allTimeAthletesF || c.athletesFAll;
        if (Array.isArray(fFAll) && fRecord) {
          fFAll.forEach((a: any) => {
            if (a && a[0]) {
              const pKey = normalizeName(a[0]);
              if (!regionStats[pKey]) regionStats[pKey] = { runs: 0, lqSum: 0 };
              regionStats[pKey].runs += 1;
              regionStats[pKey].lqSum += (fRecord / a[1]) * 100;
            }
          });
        }
      });

      return Object.values(atMet)
        .filter((p: any) => {
          const pKey = p.pKey || normalizeName(p.name);
          if (!allTimeRankedPKeys.has(pKey)) return false;
          const isFromRegion = matchRegion(p);
          const competedHere = !!regionStats[pKey];
          return isFromRegion || competedHere;
        })
        .map((p: any) => {
          const pKey = p.pKey || normalizeName(p.name);
          const stats = regionStats[pKey] || { runs: 0, lqSum: 0 };
          const regionalLQ = stats.runs > 0 ? stats.lqSum / stats.runs : 0;
          return {
            ...p,
            runs: stats.runs,
            regionalLQ: regionalLQ
          };
        })
        .sort((a: any, b: any) => b.regionalLQ - a.regionalLQ);
    }, [atMet, region, regionalCourses, allTimeRankedPKeys]);

    return (
      <div
        className={cn(
          "flex flex-col relative pb-32 transition-colors",
          theme === "dark" ? "bg-[#0a0a0c]" : "bg-white",
        )}
      >
        <ProfileHeader
          theme={theme}
          avatar={<FallbackAvatar name={region.name} sizeCls="text-3xl" />}
          title={
            <span className="flex items-center gap-2">
              <span className="truncate">{region.name.replace(/[\uD83C][\uDDE6-\uDDFF]|\p{Extended_Pictographic}/gu, '').trim()}</span>
            </span>
          }
        />

        <div
          className={cn(
            "flex items-center justify-center border-y sticky top-0 z-40 backdrop-blur-3xl transition-colors py-2",
            theme === "dark"
              ? "border-white/5 bg-zinc-950/80 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
              : "border-black/5 bg-white/90 shadow-[0_4px_30px_rgba(0,0,0,0.03)]",
          )}
        >
          <div className="flex w-full max-w-2xl px-4">
            <ASRNeonToggle
              options={[
                { label: "PLAYERS", value: "players" },
                { label: "COURSES", value: "courses" },
              ]}
              activeOption={activeTab}
              onChange={(t) => setActiveTab(t)}
              layoutId="region-tabs"
              theme={theme}
              className="w-full"
            />
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col flex-1 transition-colors",
            theme === "dark" ? "bg-[#050505]" : "bg-[#FAFAFA]",
          )}
        >
          {activeTab === "players" && (
            <InspectorTabContainer>
              <div className="grid grid-cols-2 gap-4">
                <ASRStatCard label="PLAYERS" value={regionalPlayers.length} />
                <ASRStatCard 
                  label="RUNS" 
                  value={regionalPlayers.reduce((sum, p: any) => sum + (p.runs || 0), 0)} 
                />
              </div>

              {regionalPlayers.length > 0 ? (
                <div className="mt-4">
                  <ASRRankList
                    athletes={regionalPlayers.map((p: any) => [
                      p.pKey || normalizeName(p.name),
                      p.regionalLQ || 0,
                    ])}
                    valueLabel="LQ"
                    dataContext={dataContext}
                    onEntityClick={onEntityClick}
                    limit={20}
                    entityType="player"
                    hideSubtitle={true}
                  />
                </div>
              ) : (
                <div className="mt-4">
                  <ASREmptyState 
                    theme={theme}
                    title="NO REGIONAL PLAYERS"
                    message="THERE ARE NO ALL-TIME RANKED PLAYERS REGISTERED IN THIS LOCATION YET."
                  />
                </div>
              )}
            </InspectorTabContainer>
          )}

          {activeTab === "courses" && (
            <InspectorTabContainer>
              <div className="grid grid-cols-2 gap-4">
                <ASRStatCard label="COURSES" value={regionalCourses.length} />
                <ASRStatCard 
                  label="RUNS" 
                  value={regionalCourses.reduce((sum, c: any) => sum + (c.runs || 0), 0)} 
                />
              </div>

              <div className="flex flex-col gap-4 mt-4 mb-8">
                {regionalCourses.length > 0 ? (
                  <ASRRankList
                    athletes={regionalCourses}
                    valueLabel="RUNS"
                    onEntityClick={onEntityClick}
                    limit={100}
                    dataContext={dataContext}
                    hideSubtitle={true}
                    entityType="course"
                  />
                ) : (
                  <ASREmptyState 
                    theme={theme}
                    title="NO REGIONAL COURSES"
                    message="THERE ARE NO OFFICIAL COURSES REGISTERED IN THIS LOCATION YET."
                  />
                )}
              </div>
            </InspectorTabContainer>
          )}
        </div>
      </div>
    );
  },
);
