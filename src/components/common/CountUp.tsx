import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/asr-utils";

interface CountUpProps {
  end: number;
  duration?: number;
}

export const CountUp = React.memo(
  ({ end, duration = 2000 }: CountUpProps) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);

    useEffect(() => {
      let startTimestamp: number | null = null;
      let animationFrame: number;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentCount = Math.floor(progress * end);

        if (currentCount !== countRef.current) {
          setCount(currentCount);
          countRef.current = currentCount;
        }

        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(step);
        }
      };

      animationFrame = window.requestAnimationFrame(step);
      return () => window.cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return (
      <span
        className={cn(
          "font-black tabular-nums tracking-tighter transition-all",
          "text-current",
        )}
      >
        {count}
      </span>
    );
  },
);
