/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React from "react";
import { Zap, ChevronsRight, Award, MapPin, Rocket } from "lucide-react";
import { cn, CONFIG } from "../../lib/asr-utils";
import { ASRPremiumButton } from "./ASRPremiumButton";

export type PromoType = "coach" | "setter" | "crowdfund" | "sponsor";

interface ASRPromotionBannerProps {
 type: PromoType;
 theme: "light" | "dark";
 course?: any;
}

export const ASRPromotionBanner = React.memo(
 ({ type, theme, course }: ASRPromotionBannerProps) => {
 // We compute the configuration for the banner based on the type
 const isSponsor = type === "sponsor";
 const hasSponsor = isSponsor && course && !!course.sponsorName;
 const sponsorName = hasSponsor ? course.sponsorName : null;

 const sponsorLink = isSponsor
 ? course?.sponsorLink ||
 `mailto:apexmovement@gmail.com?subject=Course Sponsorship Enquiry: ${course?.name}`
 : CONFIG.SKOOL_LINK;

 const getConfig = () => {
 switch (type) {
 case "sponsor":
 return {
 colorClass: "text-amber-500",
 bgGradient: "#f59e0b", // amber-500
 borderFocus: "border-amber-500/20",
 borderGhost: "border-amber-500/10",
 icon: hasSponsor ? (
 <div className="w-14 h-14 @md:w-16 @md:h-16 @2xl:w-24 @2xl:h-24 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-2xl @2xl:text-4xl shadow-xl uppercase italic">
 {sponsorName?.trim()[0]}
 </div>
 ) : (
 <Zap className="w-10 h-10 @2xl:w-16 @2xl:h-16 text-amber-500" />
 ),
 subtitle: hasSponsor ? "OFFICIAL PARTNER" : "SUPPORT THE PROJECT",
 title: hasSponsor ? (
 <>
 SPONSORED BY{" "}
 <span className="text-amber-500">{sponsorName}</span>
 </>
 ) : (
 <>
 ADOPT THIS <span className="text-amber-500">COURSE</span>
 </>
 ),
 desc: hasSponsor
 ? `This course is officially supported by ${sponsorName}. Check out their work and show some love to our partners who make this possible!`
 : "Course sponsorships go directly to maintaining the course IRL, digital leaaderboards, and continued development. Adopt a course to support ASR and showcase your brand.",
 btnText: hasSponsor ? "LEARN MORE" : "INQUIRE",
 btnSubText: null, // "SUPPORT THE SPEED COMMUNITY" could go here if we wanted text under the button, but we cut it for sponsors as requested
 btnProps: { color: "gold" as any, effect: "metallic" as any },
 link: sponsorLink,
 };
 case "setter":
 return {
 colorClass: "text-emerald-500",
 bgGradient: "#10b981", // emerald-500
 borderFocus: "border-emerald-500/20",
 borderGhost: "border-emerald-500/10",
 icon: (
 <MapPin className="w-10 h-10 @2xl:w-16 @2xl:h-16 text-emerald-500" />
 ),
 subtitle: "ASR COURSE SETTING TEAM",
 title: (
 <>
 COURSE SETTER{" "}
 <span className="text-emerald-500">CERTIFICATION</span>
 </>
 ),
 desc: "Learn to design, build, and validate new ASR courses for our global community. Get certified to create official ASR courses worldwide.",
 btnText: "BECOME A SETTER",
 btnSubText: "DESIGN THE NEXT GENERATION OF COURSES",
 btnProps: {
 variant: "solid" as any,
          effect: "none" as any,
 className:
 "bg-emerald-600 hover:bg-emerald-500 text-white border-none",
 },
 link: CONFIG.SKOOL_LINK,
 };
 case "crowdfund":
 return {
 colorClass: "text-pink-500",
 bgGradient: "#ec4899", // pink-500
 borderFocus: "border-pink-500/20",
 borderGhost: "border-pink-500/10",
 icon: (
 <Rocket className="w-10 h-10 @2xl:w-16 @2xl:h-16 text-pink-500" />
 ),
 subtitle: "SUPPORT THE PROJECT",
 title: (
 <>
 2026 ASR <span className="text-pink-500">CROWDFUNDER</span>
 </>
 ),
 desc: "Help us continue to build our official App, compensate setters, fund player prize pools, and grow the sport. Every contribution helps!",
 btnText: "CONTRIBUTE NOW",
 btnSubText: "FUEL THE SPEED PARKOUR MOVEMENT",
 btnProps: {
 variant: "solid" as any,
          effect: "none" as any,
 className: "bg-pink-600 hover:bg-pink-500 text-white border-none",
 },
 link: CONFIG.SKOOL_LINK,
 };
 case "coach":
 default:
 return {
 colorClass: "text-blue-500",
 bgGradient: "#3b82f6", // blue-500
 borderFocus: "border-blue-500/20",
 borderGhost: "border-blue-500/10",
 icon: (
 <Award className="w-10 h-10 @2xl:w-16 @2xl:h-16 text-blue-500" />
 ),
 subtitle: "ELITE TRAINING",
 title: (
 <>
 SPEED PARKOUR{" "}
 <span className="text-blue-500">COACHING CERTIFICATION</span>
 </>
 ),
 desc: "Learn the training methods used by the world's fastest athletes and become an officially certified ASR Speed Parkour Coach.",
 btnText: "APPLY",
 btnSubText: "ACCESS ELITE TRAINING NOW",
 btnProps: { variant: "solid" as any, effect: "none" as any },
 link: CONFIG.SKOOL_LINK,
 };
 }
 };

 const config = getConfig();

 return (
 <a
 href={config.link}
 target="_blank"
 rel="noopener noreferrer"
 className={cn(
 "@container group relative w-full rounded-[3rem] p-8 @md:p-10 @2xl:p-12 overflow-hidden flex flex-col @2xl:flex-row items-center @2xl:items-stretch justify-between gap-12 transition-all hover:scale-[1.01] active:scale-[0.99]",
 theme === "dark"
 ? "bg-zinc-950"
 : "bg-white",
 )}
 >
 <div className="relative z-10 flex flex-col gap-3 flex-1 text-left w-full min-w-0">
 <span
 className={cn(
 "text-[10px] @md:text-xs font-black uppercase tracking-[0.3em]",
 config.colorClass,
 )}
 >
 {config.subtitle}
 </span>
 <h3
 className={cn(
 "text-2xl @md:text-3xl @2xl:text-4xl font-black uppercase tracking-tight leading-none",
 "theme-text-base",
 )}
 >
 {config.title}
 </h3>
 <p
 className={cn(
 "text-xs @md:text-sm @2xl:text-base opacity-60 font-medium max-w-xl",
 theme === "dark" ? "text-zinc-400" : "text-slate-600",
 )}
 >
 {config.desc}
 </p>
 <div className="mt-4 flex flex-col items-start gap-4 w-full">
 <ASRPremiumButton
 theme={theme}
 className="w-full @2xl:w-auto px-4 @md:px-10 max-w-full"
 {...config.btnProps}
 >
 <span className="truncate min-w-0">{config.btnText}</span>
 <ChevronsRight
 className="w-4 h-4 @md:w-5 @md:h-5 shrink-0 group-hover:translate-x-1 transition-transform"
 strokeWidth={3}
 />
 </ASRPremiumButton>
 {config.btnSubText && (
 <span
 className={cn(
 "text-[8px] font-black uppercase tracking-[0.2em] opacity-40 leading-none",
 theme === "dark" ? "text-white" : "text-zinc-600",
 )}
 >
 {config.btnSubText}
 </span>
 )}
 </div>
 </div>

 <div className="relative z-10 flex shrink-0 items-center justify-center">
 <div
 className={cn(
 "w-20 h-20 @md:w-24 @md:h-24 @2xl:w-40 @2xl:h-40 rounded-3xl rotate-12 overflow-hidden flex items-center justify-center p-4 transition-colors",
 config.borderFocus,
 theme === "dark" ? "bg-zinc-900" : "bg-slate-50",
 )}
 >
 {config.icon}
 </div>
 <div
 className={cn(
 "w-20 h-20 @md:w-24 @md:h-24 @2xl:w-40 @2xl:h-40 rounded-3xl -rotate-12 overflow-hidden flex items-center justify-center p-4 -ml-10 @2xl:-ml-12 mt-6 @2xl:mt-8 opacity-50 transition-colors",
 config.borderGhost,
 theme === "dark" ? "bg-zinc-900" : "bg-slate-50",
 )}
 >
 <ChevronsRight className="w-10 h-10 @2xl:w-16 @2xl:h-16 text-zinc-500" />
 </div>
 </div>

 <div
 className={cn(
 "absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20",
 )}
 style={{
 background: `linear-gradient(to left, ${config.bgGradient}, transparent)`,
 }}
 />
 <div
 className={cn(
 "absolute -bottom-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20",
 )}
 style={{ backgroundColor: config.bgGradient }}
 />
 </a>
 );
 },
);
