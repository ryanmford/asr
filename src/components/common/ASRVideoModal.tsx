import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../lib/asr-utils";

function getYouTubeId(url: string | null) {
  if (!url) return null;
  const cleaned = url.trim();
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = cleaned.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const ASRVideoModal = () => {
  const playingVideoUrl = useAppStore(s => s.playingVideoUrl);
  const setPlayingVideoUrl = useAppStore(s => s.setPlayingVideoUrl);
  const [internalUrl, setInternalUrl] = useState(playingVideoUrl);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isOpen = !!playingVideoUrl;
  const youtubeId = getYouTubeId(internalUrl);

  // Sync internal URL
  useEffect(() => {
    if (playingVideoUrl) {
      setInternalUrl(playingVideoUrl);
      setIsLoading(true);
    }
  }, [playingVideoUrl]);

  useEffect(() => {
    if (playingVideoUrl && !(location.state as Record<string, unknown>)?.videoModal) {
      navigate(location.pathname + location.search, {
        state: { ...location.state, videoModal: true },
        replace: false
      });
    }
  }, [playingVideoUrl, location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    const isVideoModalInHistory = (location.state as Record<string, unknown>)?.videoModal;
    if (!isVideoModalInHistory && isOpen) {
      setPlayingVideoUrl(null);
    }
  }, [location.state, isOpen, setPlayingVideoUrl]);

  const handleClose = useCallback(() => {
    const isVideoModalInHistory = (location.state as Record<string, unknown>)?.videoModal;
    if (isVideoModalInHistory) {
      navigate(-1);
    } else {
      setPlayingVideoUrl(null);
    }
  }, [location.state, navigate, setPlayingVideoUrl]);

  const isVerticalOptimized = true;

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={cn(
          "fixed inset-0 z-[120] flex items-center justify-center pointer-events-auto",
          isVerticalOptimized ? "p-0 sm:p-6 lg:p-12" : "p-4 sm:p-6 lg:p-12"
        )}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/95 sm:bg-black/80 sm:backdrop-blur-md"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 20, stiffness: 500 }}
            className={cn(
              "relative mx-auto overflow-hidden flex flex-col pointer-events-auto shadow-[0_0_80px_rgba(0,0,0,0.5)] bg-black",
              isVerticalOptimized
                ? "w-full h-full sm:w-auto sm:h-[85vh] sm:max-h-[900px] sm:aspect-[9/16] rounded-none sm:rounded-[32px] sm:ring-1 sm:ring-white/10 shrink-0"
                : "w-full max-w-5xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl sm:ring-1 sm:ring-white/10 shrink-0"
            )}
            style={
              isVerticalOptimized 
              ? {} 
              : { aspectRatio: "16/9" }
            }
          >
            {/* Overlay Gradient for Close Button (Ensures it's visible over the video) */}
            <div className="absolute top-0 inset-x-0 z-20 h-40 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none" />
            
            {/* Close Button */}
            <div 
              className="absolute right-0 z-30 flex justify-end p-4 sm:p-6 pointer-events-none"
              style={{ top: "max(1rem, env(safe-area-inset-top, 2rem))" }}
            >
               <button
                onClick={handleClose}
                 className="w-14 h-14 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/60 text-white hover:bg-black transition-all pointer-events-auto border border-white/10 backdrop-blur-xl shadow-lg group active:scale-95 touch-none"
                 aria-label="Close video"
               >
                 <X size={28} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
               </button>
             </div>
 
            {youtubeId ? (
               <div className="w-full h-full relative flex-1 flex items-center justify-center rounded-none sm:rounded-[32px] overflow-hidden bg-black mt-0">
                 {isLoading && (
                   <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white/50">
                     <Loader2 className="w-8 h-8 animate-spin mb-4 text-white/80" />
                     <span className="text-sm font-medium uppercase tracking-widest">Loading Video</span>
                   </div>
                 )}
                 <iframe
                   onLoad={() => setIsLoading(false)}
                   className={cn("absolute inset-0 w-[100%] h-[100%] transition-opacity duration-500", isLoading ? "opacity-0" : "opacity-100")}
                   src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1&color=white&vq=hd1080`}
                   title="YouTube video player"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                   allowFullScreen
                   frameBorder="0"
                 />
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-12 min-h-[300px] z-10 relative bg-zinc-950">
                 <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 mb-8 shadow-2xl">
                   <ExternalLink size={32} />
                 </div>
                 <h3 className="text-white text-2xl font-black mb-3 uppercase tracking-wide">External Link</h3>
                 <p className="text-zinc-400 mb-10 max-w-[280px] leading-relaxed">
                   This media type cannot be embedded within the app.
                 </p>
                 <a
                   href={internalUrl || "#"}
                   target="_blank"
                   rel="noopener noreferrer"
                   onClick={handleClose}
                   className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                 >
                   Open in Browser
                 </a>
               </div>
             )}
           </motion.div>
         </div>
       )}
     </AnimatePresence>
   );
 };
