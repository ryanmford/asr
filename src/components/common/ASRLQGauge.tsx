import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/asr-utils";
import { CountUp } from "./CountUp";

interface ASRLQGaugeProps {
  lq: number;
  theme?: "light" | "dark";
  className?: string;
  size?: number;
}

export const ASRLQGauge = ({
  lq,
  theme = "dark",
  className,
  size = 40,
}: ASRLQGaugeProps) => {
  const stroke = Math.max(3, size / 12);
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // 260 degree arc
  const arcFraction = 260 / 360;
  const maxDash = circumference * arcFraction;
  const gap = circumference * (1 - arcFraction);

  // For the active part
  const safeLq = Math.min(Math.max(lq, 0), 100);
  const activeDash = (safeLq / 100) * maxDash;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform rotate-[140deg] absolute inset-0"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme === "dark" ? "#27272a" : "#e4e4e7"}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${maxDash} ${gap}`}
          strokeLinecap="round"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={safeLq >= 100 ? "#f59e0b" : "#3b82f6"} // amber-500 : blue-500
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${maxDash} ${circumference}`}
          strokeLinecap="round"
          initial={{ strokeDashoffset: maxDash }}
          animate={{ strokeDashoffset: maxDash - activeDash }}
          transition={{
            type: "spring",
            stiffness: 60,
            damping: 15,
            mass: 1,
            duration: 1.5,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-black tracking-tighter leading-none text-center tabular-nums",
            safeLq >= 100
              ? "text-amber-500"
              : theme === "dark"
              ? "text-white"
              : "text-zinc-900",
          )}
          style={{ fontSize: size * 0.22 }}
        >
          <CountUp end={safeLq} duration={1500} decimals={2} />
        </span>
      </div>
    </div>
  );
};
