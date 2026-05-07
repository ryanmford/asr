import React from "react";
import { ASRBaseModal } from "./common/ASRBaseModal";
import { InspectorBody } from "./inspector/InspectorBody";
import { ErrorBoundary } from "./common/ErrorBoundary";

export { InspectorBody };

interface ASRInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: {
    type: string;
    data: Record<string, unknown>;
    initialMode?: "open" | "all-time";
  } | null;
  dataContext: Record<string, unknown>;
  onEntityClick: (type: string, data: Record<string, unknown>) => void;
  theme: "light" | "dark";
  history: Record<string, unknown>[];
  historyIndex: number;
  onBack: () => void;
  onForward: () => void;
  onJump: (index: number) => void;
  canForward: boolean;
}

export const ASRInspector = React.memo(
  ({
    isOpen,
    onClose,
    activeItem,
    onEntityClick,
    theme,
    history,
    historyIndex,
    onBack,
    onForward,
    onJump,
    canForward,
  }: ASRInspectorProps) => {
    if (!activeItem) return null;

    return (
      <ASRBaseModal
        isOpen={isOpen}
        onClose={onClose}
        theme={theme}
        history={history}
        historyIndex={historyIndex}
        onBack={onBack}
        onForward={onForward}
        onJump={onJump}
        canForward={canForward}
      >
        <ErrorBoundary fallbackMessage="Oops! Failed to render this profile.">
          <InspectorBody
            type={activeItem.type}
            data={activeItem.data}
            onEntityClick={onEntityClick}
            theme={theme}
            initialMode={activeItem.initialMode}
            isNotFound={activeItem.isNotFound as boolean}
            requestedId={activeItem.requestedId}
          />
        </ErrorBoundary>
      </ASRBaseModal>
    );
  },
);
