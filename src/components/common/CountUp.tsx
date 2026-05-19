 
import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/asr-utils";

interface CountUpProps {
  end: number;
  duration?: number;
  decimals?: number;
}

export const CountUp = React.memo(
  ({ end, duration = 2000, decimals = 0 }: CountUpProps) => {
    const nodeRef = useRef<HTMLSpanElement>(null);
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setHasTriggered(true);
          }
        },
        { threshold: 0.1 }
      );

      if (nodeRef.current) {
        observer.observe(nodeRef.current);
      }

      return () => {
        if (nodeRef.current) {
          observer.unobserve(nodeRef.current);
        }
      };
    }, []);

    useEffect(() => {
      if (!hasTriggered) return;

      let startTimestamp: number | null = null;
      let animationFrame: number;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        // Ease out quadratic
        const p = Math.min((timestamp - startTimestamp) / duration, 1);
        const progress = p * (2 - p);
        
        const currentCount = progress * end;

        if (nodeRef.current) {
          if (decimals > 0) {
            nodeRef.current.textContent = currentCount.toFixed(decimals);
          } else {
            nodeRef.current.textContent = Math.floor(currentCount).toLocaleString();
          }
        }

        if (progress < 1 && p < 1) {
          animationFrame = window.requestAnimationFrame(step);
        } else if (nodeRef.current) {
          // Guarantee final value
          if (decimals > 0) {
            nodeRef.current.textContent = end.toFixed(decimals);
          } else {
            nodeRef.current.textContent = end.toLocaleString();
          }
        }
      };

      animationFrame = window.requestAnimationFrame(step);
      return () => window.cancelAnimationFrame(animationFrame);
    }, [end, duration, hasTriggered]);

    return (
      <span
        ref={nodeRef}
        className={cn(
          "font-black tabular-nums tracking-tighter transition-all",
          "text-current",
        )}
      >
        {decimals > 0 ? (0).toFixed(decimals) : "0"}
      </span>
    );
  },
);
