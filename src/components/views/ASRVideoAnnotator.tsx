import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Square, Download, Video, Trash2 } from "lucide-react";
import { cn } from "../../lib/asr-utils";

interface Annotation {
  id: string;
  type: "laser" | "start-block" | "stop-block";
  points: { x: number; y: number }[]; // Normalized coordinates 0-1
  time: number;
  freezeDuration: number;
  color: string;
  lineWidth: number;
}

interface CapturableVideoElement extends HTMLVideoElement {
  captureStream?(fps?: number): MediaStream;
  mozCaptureStream?(fps?: number): MediaStream;
}

export function ASRVideoAnnotator({ theme }: { theme: "light" | "dark" }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawingState, setDrawingState] = useState<{ active: boolean; tool: "laser" | "start-block" | "stop-block"; currentPoints: {x: number, y: number}[], color: string, lineWidth: number }>({ active: false, tool: "laser", currentPoints: [], color: "#3ae374", lineWidth: 4 });
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

  const lastFrozenIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef<boolean>(isPlaying);

  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const requestRef = useRef<number>();

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setAnnotations([]);
      setRecordingUrl(null);
      lastFrozenIdRef.current = null;
    }
  };

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation, w: number, h: number) => {
    if (ann.points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(ann.points[0].x * w, ann.points[0].y * h);
    for (let i = 1; i < ann.points.length; i++) {
      ctx.lineTo(ann.points[i].x * w, ann.points[i].y * h);
    }
    
    if (ann.type === "laser" || ann.points.length < 3) {
      // Laser Line
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.lineWidth || 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = ann.color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Polygon for Blocks
      ctx.closePath();
      ctx.fillStyle = ann.color + "40"; // 25% opacity
      ctx.fill();
      
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.lineWidth || 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ann.color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  };

  const drawActiveShape = (ctx: CanvasRenderingContext2D, points: {x:number, y:number}[], w: number, h: number, toolType: "laser" | "start-block" | "stop-block", color: string, lineWidth: number) => {
    if (points.length === 0) return;
    
    ctx.fillStyle = color;
    points.forEach(p => {
       ctx.beginPath();
       ctx.arc(p.x * w, p.y * h, 6, 0, 2 * Math.PI);
       ctx.fill();
    });

    if (points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * w, points[0].y * h);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * w, points[i].y * h);
      }
      
      if ((toolType === "start-block" || toolType === "stop-block") && points.length > 2) {
          ctx.lineTo(points[0].x * w, points[0].y * h);
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    if (canvas.width > 0 && canvas.height > 0) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const time = video.currentTime;

      // Reset lastFrozenId if we move away organically (scrubbing)
      if (lastFrozenIdRef.current) {
         const lastFrozenAnn = annotations.find(a => a.id === lastFrozenIdRef.current);
         if (!lastFrozenAnn || Math.abs(time - lastFrozenAnn.time) > 0.2) {
             lastFrozenIdRef.current = null;
         }
      }

      // Trigger Freeze
      if (!video.paused && !video.seeking) {
         const toFreeze = annotations.find(
            (a) => time >= a.time && time < a.time + 0.1 && lastFrozenIdRef.current !== a.id
         );
         
         if (toFreeze) {
             video.pause();
             lastFrozenIdRef.current = toFreeze.id;
             
             setTimeout(() => {
                 if (isPlayingRef.current && videoRef.current) {
                     videoRef.current.play();
                 }
             }, toFreeze.freezeDuration * 1000);
         }
      }

      // Draw annotations if frozen or scrubbing manually over the exact frame
      annotations.forEach((ann) => {
          const isCurrentFreeze = lastFrozenIdRef.current === ann.id && video.paused;
          const isNearTime = video.paused && Math.abs(time - ann.time) <= 0.05;
          
          if (isCurrentFreeze || isNearTime) {
              drawAnnotation(ctx, ann, canvas.width, canvas.height);
          }
      });

      // Draw currently drawing shape
      if (drawingState.active && drawingState.currentPoints.length > 0) {
         drawActiveShape(ctx, drawingState.currentPoints, canvas.width, canvas.height, drawingState.tool, drawingState.color, drawingState.lineWidth);
      }
    }

    setCurrentTime(video.currentTime);
    requestRef.current = requestAnimationFrame(drawFrame);
  }, [annotations, drawingState]);

  useEffect(() => {
    if (videoSrc) {
      requestRef.current = requestAnimationFrame(drawFrame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [drawFrame, videoSrc]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.active || !canvasRef.current || !videoRef.current) return;
    
    // Pause instantly when drawing starts
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    if (canvasRef.current.width === 0 || canvasRef.current.height === 0) return;
    
    const canvasAsp = canvasRef.current.width / canvasRef.current.height;
    const rectAsp = rect.width / rect.height;
    
    const rawX = e.nativeEvent.offsetX;
    const rawY = e.nativeEvent.offsetY;
    
    // The dimensions of the canvas element itself (not the buffer)
    const cw = rect.width;
    const ch = rect.height;

    let renderedW = cw;
    let renderedH = ch;
    let imgOffsetX = 0;
    let imgOffsetY = 0;
    
    if (canvasAsp > rectAsp) {
        // letterbox top/bottom
        renderedH = cw / canvasAsp;
        imgOffsetY = (ch - renderedH) / 2;
    } else {
        // pillarbox left/right
        renderedW = ch * canvasAsp;
        imgOffsetX = (cw - renderedW) / 2;
    }
    
    const x = (rawX - imgOffsetX) / renderedW;
    const y = (rawY - imgOffsetY) / renderedH;

    // ensure inside bounds
    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    const newPoints = [...drawingState.currentPoints, { x, y }];
    const maxPts = Infinity; // Support any number of points
    
    if (newPoints.length >= maxPts) {
      // This path is disabled, handled by "Finish Shape" mostly, but just in case:
      // ..
    } else {
      setDrawingState(prev => ({ ...prev, currentPoints: newPoints }));
    }
  };

  const finalizeShape = () => {
    if (!drawingState.active || drawingState.currentPoints.length < 2) return;
    
    const newAnn: Annotation = {
      id: Math.random().toString(36).substring(7),
      type: drawingState.tool,
      points: drawingState.currentPoints,
      time: videoRef.current ? videoRef.current.currentTime : 0,
      freezeDuration: 0.66,
      color: drawingState.color,
      lineWidth: drawingState.lineWidth,
    };
    setAnnotations(prev => [...prev, newAnn].sort((a,b) => a.time - b.time));
    setDrawingState(prev => ({ ...prev, active: false, currentPoints: [] }));
    setActiveAnnotationId(newAnn.id);
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(annotations, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "asr_course_rules_metadata.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartRecording = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    
    // Reset to beginning
    videoRef.current.currentTime = 0;
    lastFrozenIdRef.current = null;
    
    const stream = canvas.captureStream(30); // 30fps is stable and smooth without dropping too many canvas frames
    
    // Add audio track if video has one
    const capturableVid = videoRef.current as CapturableVideoElement;
    const audioTrack = capturableVid.mozCaptureStream ? capturableVid.mozCaptureStream().getAudioTracks()[0] : null;
    if (!audioTrack && capturableVid.captureStream) {
        const vidStream = capturableVid.captureStream();
        if (vidStream && vidStream.getAudioTracks().length > 0) {
            stream.addTrack(vidStream.getAudioTracks()[0]);
        }
    }
    
    try {
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9', videoBitsPerSecond: 8000000 });
    } catch {
        mediaRecorderRef.current = new MediaRecorder(stream, { videoBitsPerSecond: 8000000 });
    }
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordingUrl(url);
      recordedChunksRef.current = [];
    };
    
    recordedChunksRef.current = [];
    mediaRecorderRef.current.start();
    setIsRecording(true);
    
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
      }
    }
  };

  const handleNodescriptGen = () => {
      const scriptContent = `
// ASR HD Node.js Export Script
// Save next to your raw video: "\${videoSrc ? 'video.mp4' : 'video.mov'}"
// Usage: \`npm init -y && npm install fluent-ffmpeg canvas\` then \`node render.js\`

// NOTE: This is a placeholder indicating a feature. Pro backend rendering is recommended.
// This requires a robust pipeline. Stay tuned!
console.log("HD Export capability unlocked in version 2.0. Join ASR Discord.");
`;
      const blob = new Blob([scriptContent], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "asr_hd_render.js";
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <div className={cn(
      "w-full h-full overflow-hidden flex flex-col",
      theme === "dark" ? "text-zinc-100 bg-zinc-950" : "text-zinc-900 bg-white"
    )}>
      <div className="flex items-center justify-between flex-shrink-0 px-6 py-4 border-b border-current/10">
        <div>
           <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest leading-none">ASR Video Annotator</h1>
           <p className="text-[10px] font-medium tracking-widest opacity-60 mt-1">INTERNAL TOOL: EXPORT RAW METADATA OR WEBM</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            {videoSrc && annotations.length > 0 && (
                <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors font-black text-[10px] tracking-widest uppercase border border-white">
                    <Download size={14} /> <span className="hidden lg:inline">EXPORT MENU</span>
                </button>
            )}
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-none font-black text-[10px] tracking-widest uppercase transition-colors inline-flex items-center gap-2">
              <Video size={16} />
              <span className="hidden sm:inline">Load Video</span><span className="sm:hidden">Load</span>
              <input type="file" accept="video/mp4,video/mov,video/quicktime,video/webm" className="hidden" onChange={handleFileChange} />
            </label>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-[3] flex flex-col min-h-0 min-w-0 bg-black relative border-r border-current/10 overflow-hidden">
          <div className="flex-1 relative min-h-0">
             {!videoSrc && (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black tracking-widest uppercase opacity-30 text-white">
                  NO VIDEO LOADED
                </div>
              )}
              
              <video 
                ref={videoRef} 
                src={videoSrc || undefined} 
                className="hidden" 
                loop
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onEnded={() => {
                    setIsPlaying(false);
                    if (isRecording) handleStopRecording();
                }}
              />
              
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full object-contain cursor-crosshair"
                onClick={handleCanvasClick}
              />
          </div>
          
          {/* Transport Controls permanently beneath the video */}
          {videoSrc && (
            <div className="bg-zinc-950 border-t border-white/5 p-4 flex-shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={handlePlayPause} className="w-12 h-12 flex items-center justify-center bg-white text-black hover:bg-white/80 rounded-full transition-colors flex-shrink-0 shadow-lg">
                        {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </button>
                    <div className="flex flex-col flex-1 gap-1">
                        <div className="flex justify-between text-[10px] font-mono tracking-widest uppercase opacity-80 text-white">
                            <span>{currentTime.toFixed(2)}s</span>
                            <span>{duration.toFixed(2)}s</span>
                        </div>
                        <input 
                          type="range" 
                          min={0} 
                          max={duration} 
                          step={0.01} 
                          value={currentTime}
                          onChange={(e) => {
                              if (videoRef.current) {
                                  videoRef.current.currentTime = parseFloat(e.target.value);
                              }
                          }}
                          className="w-full h-2 cursor-pointer appearance-none bg-white/30 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Tools Area */}
        <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col min-h-0 bg-current/5">
          {/* Right Sidebar - Tools & Layers */}
          <div className="p-4 flex flex-col gap-4 flex-shrink-0 border-b border-current/10">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">DRAWING TOOLS</h3>
              <div className="grid grid-cols-2 gap-2">
                  <button 
                      onClick={() => setDrawingState(prev => ({ ...prev, active: true, tool: "start-block", currentPoints: [], color: "#3ae374", lineWidth: prev.lineWidth }))}
                      className={cn("px-2 py-3 border font-black text-[10px] tracking-widest uppercase transition-all whitespace-nowrap",
                      drawingState.active && drawingState.tool === "start-block" ? "border-green-400 text-green-400 bg-green-400/10 shadow-[0_0_15px_rgba(74,227,116,0.2)]" : "border-current/20 hover:border-current/50 hover:bg-current/5"
                      )}
                  >
                      START BLOCK
                  </button>
                  <button 
                      onClick={() => setDrawingState(prev => ({ ...prev, active: true, tool: "stop-block", currentPoints: [], color: "#ff3838", lineWidth: prev.lineWidth }))}
                      className={cn("px-2 py-3 border font-black text-[10px] tracking-widest uppercase transition-all whitespace-nowrap",
                      drawingState.active && drawingState.tool === "stop-block" ? "border-red-400 text-red-400 bg-red-400/10 shadow-[0_0_15px_rgba(255,56,56,0.2)]" : "border-current/20 hover:border-current/50 hover:bg-current/5"
                      )}
                  >
                      STOP BLOCK
                  </button>
                  <button 
                      onClick={() => setDrawingState(prev => ({ ...prev, active: true, tool: "laser", currentPoints: [], color: prev.color, lineWidth: prev.lineWidth }))}
                      className={cn("px-2 py-3 border font-black text-[10px] tracking-widest uppercase transition-all col-span-2",
                      drawingState.active && drawingState.tool === "laser" ? "border-blue-400 text-blue-400 bg-blue-400/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "border-current/20 hover:border-current/50 hover:bg-current/5"
                      )}
                  >
                      LASER LINE
                  </button>
              </div>

              {drawingState.active && (
                  <div className="flex flex-col gap-3 border-t border-current/10 pt-3 mt-1">
                      <div className="grid grid-cols-2 gap-3 items-center">
                          <label className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase opacity-60">Color:</span>
                             <input type="color" value={drawingState.color} onChange={e => setDrawingState(prev => ({...prev, color: e.target.value}))} className="w-8 h-8 rounded cursor-pointer p-0 border-0 bg-transparent" />
                          </label>
                          <label className="flex flex-col gap-1">
                             <div className="flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase opacity-60">Width:</span>
                               <span className="text-[10px] font-mono">{drawingState.lineWidth}px</span>
                             </div>
                             <input type="range" min={1} max={15} value={drawingState.lineWidth} onChange={e => setDrawingState(prev => ({...prev, lineWidth: parseInt(e.target.value)}))} className="w-full accent-current h-1" />
                          </label>
                      </div>

                      <div className="flex gap-2 mt-2">
                          <button 
                            onClick={finalizeShape}
                            disabled={drawingState.currentPoints.length < 2}
                            className="flex-1 px-2 py-3 border border-white bg-white text-black font-black text-[10px] tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            FINISH ({drawingState.currentPoints.length} PTS)
                        </button>
                          <button 
                            onClick={() => setDrawingState(prev => ({ ...prev, active: false, currentPoints: [] }))}
                            className="px-4 py-3 border border-current bg-current/5 hover:bg-current/10 font-black text-[10px] tracking-widest uppercase transition-all"
                        >
                            CANCEL
                        </button>
                      </div>
                      <p className="text-[10px] uppercase font-bold opacity-70 mt-1">
                          Click on video to plot points.
                      </p>
                  </div>
              )}
          </div>

          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="px-4 py-3 border-b flex-shrink-0 border-current/10 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">FREEZE FRAME LAYERS</h3>
                  <span className="text-[10px] font-mono opacity-50">{annotations.length} TOTAL</span>
              </div>
              
              <div className="flex flex-col flex-1 overflow-y-auto">
                  {annotations.length === 0 && (
                        <div className="text-[10px] opacity-50 uppercase tracking-widest py-8 text-center font-mono">NO CHECKPOINTS YET</div>
                  )}
                  {annotations.map((ann, _i) => (
                      <div key={ann.id} className={cn(
                          "px-4 py-3 border-b text-xs flex flex-col gap-3 transition-colors hover:bg-current/5",
                          activeAnnotationId === ann.id ? "border-current/50 bg-current/5" : "border-current/10"
                      )} onClick={() => setActiveAnnotationId(ann.id)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: ann.color, boxShadow: `0 0 8px ${ann.color}` }} />
                                    <span className="font-bold tracking-widest uppercase">
                                        {ann.type.replace('-', ' ')}
                                    </span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setAnnotations(annotations.filter(a => a.id !== ann.id)); }} className="text-red-500 hover:text-red-400 opacity-60 hover:opacity-100">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                                <label className="flex flex-col gap-1">
                                    <span className="uppercase opacity-50 flex items-center justify-between">
                                        AT (s)
                                        <button 
                                          title="Jump to time"
                                          className="px-1 py-0.5 bg-current/10 active:bg-current/20 cursor-pointer"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              if (videoRef.current) {
                                                  videoRef.current.currentTime = ann.time;
                                                  videoRef.current.pause();
                                                  setIsPlaying(false);
                                              }
                                          }}>JUMP</button>
                                    </span>
                                    <input 
                                      type="number" 
                                      value={ann.time.toFixed(2)} 
                                      step={0.1}
                                      min={0}
                                      onChange={(e) => {
                                          const newAnns = [...annotations];
                                          const idx = newAnns.findIndex(a => a.id === ann.id);
                                          newAnns[idx].time = parseFloat(e.target.value) || 0;
                                          setAnnotations(newAnns.sort((a,b) => a.time - b.time));
                                      }}
                                      className="bg-current/5 border border-current/20 outline-none focus:border-current p-1.5 w-full" 
                                    />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="uppercase opacity-50">FREEZE TIME (s)</span>
                                    <input 
                                      type="number" 
                                      value={ann.freezeDuration.toFixed(2)} 
                                      step={0.1}
                                      min={0}
                                      max={10}
                                      onChange={(e) => {
                                          const newAnns = [...annotations];
                                          const idx = newAnns.findIndex(a => a.id === ann.id);
                                          newAnns[idx].freezeDuration = parseFloat(e.target.value) || 0;
                                          setAnnotations(newAnns);
                                      }}
                                      className="bg-current/5 border border-current/20 outline-none focus:border-current p-1.5 w-full" 
                                    />
                                </label>
                            </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>
      </div>
      
      {/* Export Options Modal */}
      {showExportModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
              <div className="bg-zinc-950 border border-white/10 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h2 className="text-sm font-black uppercase tracking-widest text-white">Export Options</h2>
                      <button onClick={() => setShowExportModal(false)} className="text-white hover:text-red-400 opacity-60 hover:opacity-100 transition-colors">
                          <Square size={20} className="rounded-full" />
                      </button>
                  </div>
                  
                  <div className="p-6 flex flex-col gap-8 text-white">
                      {/* WEBM */}
                      <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white text-black flex items-center justify-center shrink-0 shadow-lg shadow-white/10">
                                  <Video size={24} />
                              </div>
                              <div className="flex-1">
                                  <h3 className="font-black uppercase text-sm tracking-widest">Fast WebM Render</h3>
                                  <p className="text-[10px] text-white/50 leading-tight mt-1 font-medium tracking-wide uppercase">Natively recorded in-browser. Medium quality. Good for quick internal review.</p>
                              </div>
                          </div>
                          {isRecording ? (
                              <button onClick={handleStopRecording} className="flex items-center justify-center gap-2 px-4 py-4 bg-red-500/20 text-red-500 border border-red-500 font-black text-[10px] tracking-widest uppercase hover:bg-red-500/30 transition-colors animate-pulse w-full">
                                  <Square size={14} /> STOP RECORDING
                              </button>
                          ) : (
                               <button onClick={handleStartRecording} className="flex items-center justify-center gap-2 px-4 py-4 bg-white text-black border border-white font-black text-[10px] tracking-widest uppercase hover:bg-gray-200 transition-colors w-full shadow-lg">
                                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> START WEBM RECORDING
                              </button>
                          )}
                          {recordingUrl && (
                              <a href={recordingUrl} download="asr_course_rules.webm" className="flex justify-center flex-col items-center gap-2 px-4 py-4 bg-blue-500/20 text-blue-400 border border-blue-500 font-black text-[10px] tracking-widest uppercase hover:bg-blue-500/30 transition-colors w-full">
                                  <span className="flex items-center gap-2"><Download size={14} /> SAVE RECORDED WEBM</span>
                                  <span className="text-[9px] opacity-70">Depending on canvas layers, it may be choppy on slower devices.</span>
                              </a>
                          )}
                      </div>

                      <div className="h-px bg-white/10 w-full" />

                      {/* HQ MP4 */}
                      <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 border border-blue-500 text-blue-400 bg-blue-500/10 flex items-center justify-center shrink-0">
                                  <Download size={24} />
                              </div>
                              <div className="flex-1">
                                  <h3 className="font-black whitespace-nowrap uppercase text-sm tracking-widest flex items-center gap-3">HD Node Render <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 border border-blue-500/30 tracking-widest">EXPERIMENTAL</span></h3>
                                  <p className="text-[10px] text-white/50 leading-tight mt-1 font-medium tracking-wide uppercase">Downloads an FFMPEG pipeline script + JSON. Generates 4K 60fps MP4 offline. Perfect for YouTube/IG.</p>
                              </div>
                          </div>
                          <button onClick={handleNodescriptGen} className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-blue-600 text-white font-black text-[10px] tracking-widest uppercase hover:bg-blue-500 transition-colors shadow-lg">
                              <Download size={14} /> DOWNLOAD RENDER PIPELINE
                          </button>
                      </div>

                      <div className="h-px bg-white/10 w-full" />

                      {/* JSON Metadata */}
                      <div className="flex flex-col gap-3 opacity-60 hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-3">
                              <div className="flex-1">
                                  <h3 className="font-black uppercase text-[10px] tracking-widest text-white">Raw Payload JSON</h3>
                                  <p className="text-[10px] text-white/50 leading-tight mt-1 font-medium tracking-wide">Export checkpoint data array manually.</p>
                              </div>
                              <button onClick={handleExportJSON} className="flex items-center gap-2 px-4 py-3 border border-white/20 hover:border-white text-white font-black text-[10px] tracking-widest uppercase transition-colors bg-white/5">
                                  EXPORT
                              </button>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
