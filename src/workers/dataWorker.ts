import { computeAllState } from "../lib/asr-data-compute";

self.onmessage = (e) => {
  const { type, payload } = e.data;
  
  if (type === 'PROCESS_AND_COMPUTE') {
      const finalState = computeAllState(payload);

      self.postMessage({ 
          type: 'COMPUTE_ALL_READY', 
          payload: finalState
      });
  }
};
