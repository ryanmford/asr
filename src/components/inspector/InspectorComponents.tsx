import React from "react";
import { Building2, ArrowRight } from "lucide-react";
import { cn, trackEvent } from "../../lib/asr-utils";
import { ASRPremiumButton } from "../common/ASRPremiumButton";
import { FittingHeader } from "../common/FittingHeader";

interface ProfileHeaderProps {
  avatar: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  theme: "light" | "dark";
  extra?: React.ReactNode;
}

export const ProfileHeader = React.memo(
  ({ avatar, title, subtitle, extra, theme }: ProfileHeaderProps) => (
    <div
      className={cn(
        "px-4 py-5 flex flex-col gap-4 relative overflow-hidden transition-colors border-b",
        theme === "dark"
          ? "bg-[#030303] border-white/5"
          : "bg-white border-black/5",
      )}
    >
      {/* Subtle Depth Gradient */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none opacity-40",
          theme === "dark"
            ? "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_60%)]"
            : "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.04),transparent_60%)]",
        )}
      />

      {/* Top Row: Avatar + Name/Bio */}
      <div className="flex items-center gap-5 relative z-10 w-full pl-1">
        <div className="relative shrink-0 group">
          <div
            className={cn(
              "w-[76px] h-[76px] rounded-full p-[3px] relative z-10 transition-all duration-500 overflow-hidden",
              theme === "dark" ? "bg-zinc-800" : "bg-zinc-200",
            )}
          >
            <div className="w-full h-full rounded-full bg-[#030303] overflow-hidden flex items-center justify-center p-0.5">
              {avatar}
            </div>
          </div>
          {/* Subtle ring outline around avatar */}
          <div
            className={cn(
              "absolute -inset-1 rounded-full border opacity-10 pointer-events-none",
              theme === "dark" ? "border-white" : "border-black",
            )}
          />
        </div>

        <div className="flex flex-col items-start justify-center flex-1 min-w-0 pr-2">
          <FittingHeader
            align="left"
            theme={theme}
            className={cn(
              "w-full border-none justify-start m-0 p-0 text-left -ml-1 h-auto min-h-0 bg-transparent flex items-center",
              theme === "dark" ? "text-white" : "text-zinc-900",
            )}
          >
            {title}
          </FittingHeader>

          {subtitle && (
            <div className="flex flex-wrap items-center w-full">
              {typeof subtitle === "string" ? (
                <FittingHeader
                  align="left"
                  theme={theme}
                  baseSize="0.85rem"
                  textClassName="font-bold tracking-widest opacity-80"
                  className={cn(
                    "w-full border-none justify-start m-0 p-0 text-left -ml-1 h-auto min-h-0 bg-transparent flex items-center",
                    theme === "dark" ? "text-zinc-300" : "text-zinc-700",
                  )}
                >
                  {subtitle}
                </FittingHeader>
              ) : (
                subtitle
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col relative z-10 w-full">
        {/* Extra Bottom Tags/Features */}
        {extra && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300 mt-2 pl-1">
            {extra}
          </div>
        )}
      </div>
    </div>
  ),
);



export const ASRPatronPill = React.memo(({ course, theme, isBanner }: { course: Record<string, unknown> & { asrPatron?: string }; theme: "light" | "dark"; isBanner?: boolean }) => {
  const hasSponsor = !!course.sponsorName;
  const sponsorName = course.sponsorName;
  const sponsorLink =
    course.sponsorLink ||
    `mailto:apexmovement@gmail.com?subject=Course Sponsorship Enquiry: ${course.name}`;

  const getInitials = (n: string) => {
    if (!n) return "A";
    const clean = String(n).trim();
    return clean.length > 0 ? clean[0].toUpperCase() : "A";
  };

  if (hasSponsor) {
    return (
      <ASRPremiumButton
        href={sponsorLink}
        onClick={() => {
          trackEvent("outbound_click", {
            link_url: sponsorLink,
            link_type: "sponsor",
          });
        }}
        target="_blank"
        rel="noopener noreferrer"
        variant="solid"
        color="gold"
        theme={theme}
        radius={isBanner ? "none" : "2xl"}
        effect="metallic"
        className={cn(
          "w-full flex items-center px-6 h-[64px]",
          theme === "dark"
            ? "shadow-[0_0_30px_rgba(251,191,36,0.15)] group-hover:shadow-[0_0_40px_rgba(251,191,36,0.25)]"
            : "shadow-[0_10px_30px_rgba(251,191,36,0.15)]",
        )}
      >
        <div className="flex items-center justify-between w-full opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black italic shadow-sm uppercase shrink-0 transition-opacity",
                "bg-amber-500 text-white",
              )}
            >
              {getInitials(sponsorName)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-80 leading-none">
                OFFICIAL COURSE SPONSOR
              </span>
              <span
                className={cn(
                  "text-[14px] font-black uppercase tracking-widest mt-0.5",
                )}
              >
                {sponsorName}
              </span>
            </div>
          </div>
          <ArrowRight
            size={16}
            className="shrink-0 opacity-80 group-hover:opacity-100 transition-all group-hover:translate-x-1"
          />
        </div>
      </ASRPremiumButton>
    );
  }

  return (
    <ASRPremiumButton
      href={sponsorLink}
      target="_blank"
      rel="noopener noreferrer"
      variant="solid"
      color="gold"
      theme={theme}
      radius={isBanner ? "none" : "2xl"}
      className={cn(
        "w-full flex items-center px-6 h-[64px]",
        theme === "dark"
          ? "shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          : "shadow-[0_4px_10px_rgba(0,0,0,0.1)]",
      )}
    >
      <div className="flex items-center justify-between w-full opacity-80 group-hover:opacity-100 transition-opacity min-w-0">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <Building2 className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-wider transition-colors text-left break-words whitespace-normal leading-tight">
            ADOPT A COURSE, SUPPORT THE PROJECT
          </span>
        </div>
        <ArrowRight
          size={16}
          className="shrink-0 transition-all group-hover:translate-x-1"
        />
      </div>
    </ASRPremiumButton>
  );
});

export const SectionTitle = React.memo(
  ({
    children,
    className,
    noPadding,
  }: {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
  }) => (
    <span
      className={cn(
        "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500",
        !noPadding && "pl-1",
        className,
      )}
    >
      {children}
    </span>
  ),
);

export const InspectorTabContainer = React.memo(
  ({
    children,
    className,
    tight,
  }: {
    children: React.ReactNode;
    className?: string;
    tight?: boolean;
  }) => (
    <div
      className={cn(
        "animate-in fade-in duration-300 flex flex-col",
        tight ? "p-4 gap-6" : "p-6 gap-10",
        className,
      )}
    >
      {children}
    </div>
  ),
);

