 
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/asr-utils";

interface CountUpProps {
  end: number;
  duration?: number;
}

export const CountUp = React.memo(
  ({ end, duration = 2000 }: CountUpProps) => {
    const nodeRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      let startTimestamp: number | null = null;
      let animationFrame: number;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentCount = Math.floor(progress * end);

        if (nodeRef.current) {
          nodeRef.current.textContent = currentCount.toString();
        }

        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(step);
        } else if (nodeRef.current) {
          // Guarantee final value
          nodeRef.current.textContent = end.toString();
        }
      };

      animationFrame = window.requestAnimationFrame(step);
      return () => window.cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return (
      <span
        ref={nodeRef}
        className={cn(
          "font-black tabular-nums tracking-tighter transition-all",
          "text-current",
        )}
      >
        0
      </span>
    );
  },
);
