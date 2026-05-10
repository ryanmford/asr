import React, { useMemo, startTransition } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { cn, formatLocation, normalizeName } from "../../lib/asr-utils";
import { ASRStatCard } from "../ui/ASRStatCard";
import { FallbackAvatar } from "../ui/FallbackAvatar";
import { ProfileHeader, InspectorTabContainer } from "./InspectorComponents";
import { ASRRankList } from "../list/ASRRankList";

import { ASRNeonToggle } from "../ui/ASRNeonToggle";

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

    const [, setSearchParams] = useSearchParams();
    const location = useLocation();
    const activeTab = "players"; // Only one tab anyway
    const setActiveTab = (t: string) => {
      startTransition(() => {
        setSearchParams(
          (prev) => {
            prev.set("tab", t);
            return prev;
          },
          { replace: true, state: location.state },
        );
      });
    };

    const regionalPlayers = useMemo(() => {
      return Object.values(atMet)
        .filter(
          (p: PlayerProfile) => p.countryName === region.name || p.region === region.name,
        )
        .sort(
          (a: PlayerProfile, b: PlayerProfile) =>
            (b.pts || b.rating || 0) - (a.pts || a.rating || 0),
        );
    }, [atMet, region.name]);

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
              <span className="drop-shadow-xl shrink-0 text-xl">
                {region.flag || "🌐"}
              </span>
              <span className="truncate">{region.name}</span>
            </span>
          }
          subtitle={formatLocation({ country: region.name })}
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
              options={[{ label: "PLAYERS", value: "players" }]}
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
              <div className="flex flex-col">
                <h1 className="text-2xl font-black uppercase tracking-tight italic">
                  TOP PLAYERS
                </h1>
                <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
                  RANKED BY PERFORMANCE
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ASRStatCard label="PLAYERS" value={regionalPlayers.length} />
                <ASRStatCard
                  label="REGIONAL WINS"
                  value={
                    regionalPlayers.reduce(
                      (sum: number, p: PlayerProfile) => sum + (p.wins || 0),
                      0,
                    ) as number
                  }
                />
                <ASRStatCard
                  label="PEAK RATING"
                  value={Math.max(
                    ...regionalPlayers.map((p: PlayerProfile) => p.rating || 0),
                    0,
                  ).toFixed(2)}
                />
              </div>

              <ASRRankList
                athletes={regionalPlayers.map((p: PlayerProfile) => [
                  p.pKey || normalizeName(p.name),
                  p.pts,
                ])}
                valueLabel="PTS"
                dataContext={dataContext}
                onEntityClick={onEntityClick}
                limit={20}
                entityType="player"
                hideSubtitle={true}
              />
            </InspectorTabContainer>
          )}
        </div>
      </div>
    );
  },
);
