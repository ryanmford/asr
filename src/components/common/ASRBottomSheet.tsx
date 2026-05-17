import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "motion/react";

function useWindowSize() {
  const [size, setSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });
  useLayoutEffect(() => {
    const handleResize = () => {
      setSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    }
  }, []);
  return size;
}

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints: number[]; // e.g., [0.2, 0.5, 0.9] of window height // wait, they want absolute control?
  initialSnap?: number;
  activeSnap?: number | null;
  onSnapChange?: (snap: number) => void;
}

export const ASRBottomSheet: React.FC<BottomSheetProps> = ({
  children,
  snapPoints,
  initialSnap = snapPoints[0],
  activeSnap,
  onSnapChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { height } = useWindowSize();
  const H = height || window.innerHeight;

  const getPoints = () => snapPoints.map(p => H * (1 - p));

  const y = useMotionValue(H * (1 - initialSnap));

  const bgOpacity = useTransform(y, [H * 0.1, H * 0.8], [0.4, 0]);

  // Flatten border radius near the highest snap point to seal off "little holes" (only if it hits the top notch)
  const maxSnap = Math.max(...snapPoints);
  const highestY = H * (1 - maxSnap);
  const borderRadius = useTransform(y, [highestY, highestY + 40], [maxSnap >= 0.95 ? 0 : 32, 32], { clamp: true }); // 0 to 32px

  // Sync external activeSnap control
  useEffect(() => {
    if (activeSnap !== undefined && activeSnap !== null && height > 0) {
      animate(y, H * (1 - activeSnap), {
        type: "spring",
        stiffness: 400,
        damping: 40,
        mass: 0.8,
      });
    }
  }, [activeSnap, height]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentY = y.get();
    const velocity = info.velocity.y;
    
    // Predict where the sheet would land based on current velocity
    const predictedY = currentY + velocity * 0.05; // look ahead a tiny bit
    
    const points = getPoints();
    
    // Find closest snap point
    let closestPoint = points[0];
    let minDistance = Math.abs(predictedY - points[0]);
    let closestIndex = 0;
    
    for (let i = 1; i < points.length; i++) {
        const distance = Math.abs(predictedY - points[i]);
        if (distance < minDistance) {
            minDistance = distance;
            closestPoint = points[i];
            closestIndex = i;
        }
    }
    
    animate(y, closestPoint, {
       type: "spring",
       stiffness: 400, 
       damping: 40,
       mass: 0.8,
       velocity: velocity,
    });
    
    if (onSnapChange) {
        onSnapChange(snapPoints[closestIndex]);
    }
  };

  return (
    <>
      {/* Optional backdrop: uses backdrop-blur and a subtle dark tint */}
      <motion.div 
         className="fixed inset-0 z-40 pointer-events-none backdrop-blur-[2px]"
         style={{ opacity: bgOpacity, backgroundColor: 'rgba(0,0,0,0.3)' }} 
      />

      <motion.div
        ref={containerRef}
        className="fixed left-0 right-0 bottom-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-black/10 dark:border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col pointer-events-auto overflow-hidden"
        style={{ 
           y, 
           height: H, // sheet is full height but pushed down via Y
           borderTopLeftRadius: borderRadius,
           borderTopRightRadius: borderRadius
        }}
        drag="y"
        dragConstraints={{ top: H * (1 - Math.max(...snapPoints)), bottom: H * (1 - Math.min(...snapPoints)) }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        dragMomentum={false}
      >
        <div className="w-full flex justify-center py-3 shrink-0 touch-none cursor-grab active:cursor-grabbing">
           <div className="w-9 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
        </div>
        
        <div 
           className="flex-1 w-full overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom)]"
           onPointerDown={(e) => {
             // Only allow scrolling (by stopping drag propagation) if fully expanded.
             // If not fully expanded, swiping the list drags the drawer instead!
             if (activeSnap !== undefined && activeSnap >= 0.8) {
               e.stopPropagation();
             }
           }}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
};
