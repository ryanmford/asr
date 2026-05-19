import { computeAllState, computeLiveLadderWindow } from "../lib/asr-data-compute";

self.onmessage = (e) => {
  const { type, payload } = e.data;
  
  if (type === 'PROCESS_AND_COMPUTE') {
      const finalState = computeAllState(payload);

      self.postMessage({ 
          type: 'COMPUTE_ALL_READY', 
          payload: finalState
      });
  } else if (type === 'COMPUTE_LIVE_LADDER') {
      const { requestId, records, myKey, myName, deferredTargetTime, simulatedPts, athletePool } = payload;
      const result = computeLiveLadderWindow(records, myKey, myName, deferredTargetTime, simulatedPts, athletePool);
      self.postMessage({
          type: 'LIVE_LADDER_READY',
          payload: { requestId, result }
      });
  }
};
