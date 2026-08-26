import assert from "node:assert/strict";
import { MAX_ATTEMPTS, routeFailedJob, type PropertyJob } from "./property_dlq.ts";

const failingInspection: PropertyJob = {
  job_id: "inspection-17",
  kind: "inspection-reminder",
  property_id: "building-4",
  attempts: MAX_ATTEMPTS,
  details: "annual inspection reminder",
};

assert.equal(routeFailedJob(failingInspection), "dead-letter");
assert.equal(routeFailedJob({ ...failingInspection, attempts: MAX_ATTEMPTS - 1 }), "retry");
console.log("dead-letter decision: passed");
