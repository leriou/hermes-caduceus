import { invoke } from "@tauri-apps/api/core";
import type { Result } from "@shared/api-types";

export function listCronJobs(
  includeDisabled?: boolean,
  profile?: string,
): Promise<
  Array<{
    id: string;
    name: string;
    schedule: string;
    prompt: string;
    state: "active" | "paused" | "completed";
    enabled: boolean;
    next_run_at: string | null;
    last_run_at: string | null;
    last_status: string | null;
    last_error: string | null;
    repeat: { times: number | null; completed: number } | null;
    deliver: string[];
    skills: string[];
    script: string | null;
  }>
> {
  return invoke("list_cron_jobs", { includeDisabled, profile });
}
export function createCronJob(
  schedule: string,
  prompt?: string,
  name?: string,
  deliver?: string,
  profile?: string,
): Promise<Result> {
  return invoke("create_cron_job", {
    schedule,
    prompt,
    name,
    deliver,
    profile,
  });
}
export function updateCronJob(
  jobId: string,
  schedule?: string,
  prompt?: string,
  name?: string,
  deliver?: string,
  profile?: string,
): Promise<Result> {
  return invoke("update_cron_job", {
    jobId,
    schedule,
    prompt,
    name,
    deliver,
    profile,
  });
}
export function removeCronJob(
  jobId: string,
  profile?: string,
): Promise<Result> {
  return invoke("remove_cron_job", { jobId, profile });
}
export function pauseCronJob(jobId: string, profile?: string): Promise<Result> {
  return invoke("pause_cron_job", { jobId, profile });
}
export function resumeCronJob(
  jobId: string,
  profile?: string,
): Promise<Result> {
  return invoke("resume_cron_job", { jobId, profile });
}
export function triggerCronJob(
  jobId: string,
  profile?: string,
): Promise<Result> {
  return invoke("trigger_cron_job", { jobId, profile });
}
export function listCronHistory(profile?: string): Promise<
  Array<{
    jobId: string;
    jobName: string;
    runAt: string;
    status: "ok" | "fail" | "empty";
    size: number;
    path: string;
  }>
> {
  return invoke("list_cron_history", { profile });
}
export function readCronOutput(
  path: string,
  profile?: string,
): Promise<string> {
  return invoke("read_cron_output", { path, profile });
}
