import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../../lib/asr-utils";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  theme: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ASR Core Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center p-6 text-center select-none bg-black text-white font-sans",
            this.props.theme === "light" && "bg-zinc-50 text-black",
          )}
        >
          <div className="max-w-md w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-2",
                this.props.theme === "light"
                  ? "bg-zinc-200/50 text-zinc-500"
                  : "bg-zinc-800/50 text-zinc-400"
              )}
            >
              <AlertCircle size={32} strokeWidth={1.5} />
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                Oops, something went wrong
              </h1>
              <p className="text-sm opacity-60 leading-relaxed">
                We're having trouble loading this view. You can try refreshing the page or navigating back.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "mt-4 px-6 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                this.props.theme === "dark"
                  ? "theme-focus"
                  : "focus-visible:ring-offset-white",
                this.props.theme === "light"
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-white text-black hover:bg-zinc-100"
              )}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
