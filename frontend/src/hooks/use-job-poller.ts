import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { JobStatus } from '@/types/api';

const POLL_INTERVAL_MS = 1000;

export function useJobPoller() {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (jobStatusId: number) => {
      setIsPolling(true);

      const poll = async () => {
        try {
          const status = await apiFetch<JobStatus>(
            `/job_statuses/${jobStatusId}`,
          );
          setJobStatus(status);
          if (status.status === 'completed' || status.status === 'failed') {
            stopPolling();
          }
        } catch {
          stopPolling();
        }
      };

      poll();
      intervalRef.current = window.setInterval(poll, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  const reset = useCallback(() => {
    setJobStatus(null);
    stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { jobStatus, isPolling, startPolling, reset };
}
