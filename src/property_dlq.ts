import { infrai } from "./infrai.ts";

export type JobKind = "maintenance" | "tenant-document" | "inspection-reminder";
export type PropertyJob = { job_id: string; kind: JobKind; property_id: string; attempts: number; details: string };

export const MAX_ATTEMPTS = 3;

export function routeFailedJob(job: PropertyJob): "retry" | "dead-letter" {
  return job.attempts >= MAX_ATTEMPTS ? "dead-letter" : "retry";
}

export async function moveToDeadLetter(job: PropertyJob): Promise<void> {
  const deadLetterPayload = {
    dead_letter: true,
    source_job_id: job.job_id,
    kind: job.kind,
    property_id: job.property_id,
    attempts: job.attempts,
    details: job.details,
  };
  await infrai.queue.publish(deadLetterPayload);
}

export async function consumePropertyJobs(): Promise<void> {
  const result = await infrai.queue.consume(10, 60) as { messages?: Array<{ message_id: string; payload: PropertyJob }> };
  for (const message of result.messages ?? []) {
    const decision = routeFailedJob(message.payload);
    if (decision === "dead-letter") await moveToDeadLetter(message.payload);
    await infrai.queue.ack(message.message_id);
    console.log(`${message.payload.kind}:${message.payload.job_id} -> ${decision}`);
  }
}

if (process.argv[1]?.endsWith("property_dlq.ts")) consumePropertyJobs().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
