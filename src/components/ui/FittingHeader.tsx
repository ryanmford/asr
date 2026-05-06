import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/asr-utils";

interface FittingHeaderProps {
 children: React.ReactNode;
 className?: string;
 textClassName?: string;
 theme?: "light" | "dark";
 align?: "left" | "center" | "right";
 baseSize?: string;
}

export const FittingHeader = React.memo(
 ({ children, className, textClassName, theme, align = "center", baseSize = "2rem" }: FittingHeaderProps) => {
 const containerRef = useRef<HTMLHeadingElement>(null);
 const textRef = useRef<HTMLDivElement>(null);
 const [scale, setScale] = useState(1);

 useEffect(() => {
 const handleResize = () => {
 if (containerRef.current && textRef.current) {
 const containerWidth = containerRef.current.clientWidth;
 const textWidth = textRef.current.scrollWidth;

 if (textWidth > 0 && containerWidth > 0) {
 const ratio = (containerWidth * 0.95) / textWidth; // Use slightly more width for better fill
 setScale(Math.min(1.0, ratio));
 }
 }
 };

 handleResize();
 const observer = new ResizeObserver(handleResize);
 if (containerRef.current) observer.observe(containerRef.current);
 return () => observer.disconnect();
 }, [children]);

 const alignmentClasses = {
 left: "justify-start",
 center: "justify-center",
 right: "justify-end"
 };

 const transformOriginMap = {
 left: "left center",
 center: "center center",
 right: "right center"
 };

 return (
 <h1
 ref={containerRef}
 className={cn(
 "w-full flex items-center relative overflow-hidden",
 alignmentClasses[align],
 className,
 "theme-text-base",
 )}
 >
 <div
 ref={textRef}
 style={{
 transform: `scale(${scale}) translateZ(0)`,
 fontSize: baseSize,
 lineHeight: "1.2",
 transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
 transformOrigin: transformOriginMap[align],
 width: "max-content",
 padding: "0.15em 0",
 backfaceVisibility: "hidden",
 WebkitFontSmoothing: "antialiased"
 }}
 className={cn("whitespace-nowrap flex items-center gap-3 font-black uppercase tracking-tighter", textClassName)}
 >
 {children}
 </div>
 </h1>
 );
 },
);
