import React, { useMemo } from "react";
import { cn } from "../../lib/asr-utils";

interface FallbackAvatarProps {
  name: string;
  sizeCls?: string;
  initialsOverride?: string;
  className?: string;
  style?: React.CSSProperties;
}

const GRADIENTS = [
  ["#4f46e5", "#3b82f6"],
  ["#059669", "#06b6d4"],
  ["#e11d48", "#f97316"],
  ["#7c3aed", "#a855f7"],
  ["#d97706", "#eab308"],
  ["#1d4ed8", "#4f46e5"],
];

const stringToHash = (str: string) => {
  let hash = 0;
  const s = String(str || "ASR");
  for (let i = 0; i < s.length; i++)
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
};

const getInitials = (n: string, override: string) => {
  if (override) return override.toUpperCase();
  if (!n) return "ASR";
  const words = String(n).trim().split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }
  if (words.length === 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) return words[0][0].toUpperCase();
  return "AS";
};

const svgCache = new Map<string, string>();

const generateAvatarSvg = (name: string, initials: string) => {
  const cacheKey = `${name}-${initials}`;
  if (svgCache.has(cacheKey)) return svgCache.get(cacheKey)!;

  const hash = stringToHash(name);
  const [c1, c2] = GRADIENTS[hash % GRADIENTS.length];
  const scale = initials.length === 3 ? 0.8 : initials.length === 1 ? 1.2 : 1.0;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="g${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${c2}" stop-opacity="0.3"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="#09090b" />
    <rect width="100" height="100" fill="url(#g${hash})" />
    <circle cx="20" cy="20" r="80" fill="rgba(255,255,255,0.1)" />
    <text x="50" y="50" font-family="system-ui, sans-serif" font-weight="900" font-size="${40 * scale}" fill="#ffffff" text-anchor="middle" dominant-baseline="central" alignment-baseline="central">
      ${initials}
    </text>
  </svg>`;

  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  svgCache.set(cacheKey, dataUri);
  return dataUri;
};

export const FallbackAvatar = React.memo(
  ({
    name,
    sizeCls = "w-full h-full text-xl sm:text-4xl",
    initialsOverride = "",
    className,
    style,
  }: FallbackAvatarProps) => {
    const initials = getInitials(name, initialsOverride);
    const src = useMemo(() => generateAvatarSvg(name, initials), [name, initials]);

    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={cn("rounded-full object-cover", sizeCls, className)}
        style={style}
        loading="lazy"
        decoding="async"
      />
    );
  },
  (prev, next) => {
    return prev.name === next.name && prev.initialsOverride === next.initialsOverride && prev.className === next.className;
  }
);
