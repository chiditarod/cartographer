import { apiFetch } from '@/lib/api-client';
import { JobStatus } from '@/types/api';

export function getJobStatus(id: number): Promise<JobStatus> {
  return apiFetch<JobStatus>(`/job_statuses/${id}`);
}
