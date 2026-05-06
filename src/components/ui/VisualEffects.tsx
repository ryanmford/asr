import React, { useState } from "react";

export const use3DTilt = (intensity = 15) => {
 const [tilt, setTilt] = useState({ x: 0, y: 0 });

 const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
 const el = e.currentTarget;
 const rect = el.getBoundingClientRect();
 const x = e.clientX - rect.left;
 const y = e.clientY - rect.top;
 const centerX = rect.width / 2;
 const centerY = rect.height / 2;
 const rotateY = ((x - centerX) / centerX) * intensity;
 const rotateX = ((centerY - y) / centerY) * intensity;
 setTilt({ x: rotateX, y: rotateY });
 };

 const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

 return { tilt, handleMouseMove, handleMouseLeave };
};

export const NoiseOverlay = () => (
 <div
 className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
 style={{
 backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
 }}
 />
);

export const MathOverlay = () => (
 <div
 className="absolute inset-0 opacity-[0.07] pointer-events-none overflow-hidden select-none"
 style={{ maskImage: "linear-gradient(to bottom, black, transparent)" }}
 >
 <pre className="text-[6px] font-mono leading-[1.1] scale-150 origin-top-left p-4 rotate-[-5deg]">
 {`∇×E = -∂B/∂t\n∇⋅D = ρ\n∫F⋅dl = -dΦ/dt\n∑F = ma\nE = mc²\nPV = nRT\nΔU = Q - W\nF = G(m₁m₂)/r²\nλ = h/p\niħ∂ψ/∂t = Ĥψ`}
 </pre>
 </div>
);

export const PhysicsOverlay = () => (
 <div className="absolute inset-0 opacity-[0.1] pointer-events-none overflow-hidden select-none flex items-center justify-center">
 <div className="w-full h-full border-[0.5px] border-white/20 rounded-full animate-[spin_60s_linear_infinite]" />
 <div className="absolute w-4/5 h-4/5 border-[0.5px] border-white/10 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
 <div className="absolute w-2/3 h-2/3 border-[0.5px] border-white/5 rounded-full animate-[spin_20s_linear_infinite]" />
 </div>
);

export const DenseOverlay = () => (
 <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden select-none">
 <div className="grid grid-cols-12 grid-rows-12 h-full w-full border-white/10">
 {Array.from({ length: 144 }).map((_, i) => (
 <div key={i} className="border-[0.2px] border-white/5" />
 ))}
 </div>
 </div>
);
