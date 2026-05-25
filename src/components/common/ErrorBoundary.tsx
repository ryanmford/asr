import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Home } from "lucide-react";
import { cn } from "../../lib/asr-utils";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center min-h-[50vh] w-full h-full">
          <div
            className={cn(
              "p-8 sm:p-12 w-full max-w-sm rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center gap-4 transition-colors",
              "theme-panel",
            )}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1 bg-black/5 dark:bg-white/5">
              <AlertTriangle size={24} className="theme-text-faint" />
            </div>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-widest theme-text-base">
              RECORD NOT FOUND
            </h3>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-50 px-2 theme-text-muted">
              {this.props.fallbackMessage || "Oops, the data lost its way! Please refresh."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-xs font-bold uppercase tracking-[0.1em]"
            >
              <Home size={14} /> Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
