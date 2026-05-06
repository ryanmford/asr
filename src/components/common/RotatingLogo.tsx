import React from "react";
import { Zap } from "lucide-react";

export const RotatingLogo = React.memo(() => {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center overflow-visible">
      <Zap
        size={20}
        strokeWidth={2.5}
        fill="currentColor"
        className="text-inherit"
      />
    </div>
  );
});
