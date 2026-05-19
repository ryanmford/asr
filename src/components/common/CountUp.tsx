 
import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/asr-utils";

interface CountUpProps {
  end: number;
  duration?: number;
}

export const CountUp = React.memo(
  ({ end, duration = 2000 }: CountUpProps) => {
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
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentCount = Math.floor(progress * end);

        if (nodeRef.current) {
          nodeRef.current.textContent = currentCount.toLocaleString();
        }

        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(step);
        } else if (nodeRef.current) {
          // Guarantee final value
          nodeRef.current.textContent = end.toLocaleString();
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
        0
      </span>
    );
  },
);
