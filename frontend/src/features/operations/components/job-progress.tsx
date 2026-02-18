import type { JobStatus } from '@/types/api';
import { ProgressBar } from '@/components/ui/progress-bar';

interface JobProgressProps {
  jobStatus: JobStatus | null;
  isPolling: boolean;
}

export function JobProgress({ jobStatus, isPolling }: JobProgressProps) {
  if (!jobStatus && !isPolling) {
    return null;
  }

  if (!jobStatus && isPolling) {
    return (
      <div className="text-sm text-gray-500">Starting job...</div>
    );
  }

  if (!jobStatus) return null;

  return (
    <div className="space-y-1">
      <ProgressBar
        progress={jobStatus.progress}
        total={jobStatus.total}
        status={jobStatus.status}
        message={jobStatus.message}
      />
      {jobStatus.status === 'failed' && (
        <p className="text-sm text-red-600">
          Job failed{jobStatus.message ? `: ${jobStatus.message}` : '.'}
        </p>
      )}
    </div>
  );
}
