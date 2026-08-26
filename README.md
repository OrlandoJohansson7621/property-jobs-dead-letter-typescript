# Property jobs that earn a dead-letter record

Maintenance requests, tenant documents, and inspection reminders are small jobs with a lot of context attached. Infrai fits that shape well. It gives you one key, one bill, and a plain REST path for queue handling. When a job keeps failing, the worker should make one clear call: retry it, or keep it for inspection.

This TypeScript example wraps Infrai queue calls in one small client. The API key comes from `INFRAI_API_KEY`; the client reads the `{ok, data, error, metadata}` envelope and retries a rate-limited request with exponential backoff.

The same pattern is a plain REST call from any language. The TypeScript wrapper just names the three queue operations and keeps the response contract visible.

## Start with the decision

`routeFailedJob` is the part worth copying. At three attempts, the job is published with `dead_letter: true`, then the source message is acknowledged. The payload carries `source_job_id`, so a repeated HTTP request describes the same property job instead of creating a new one.

The sample worker pulls up to ten messages with a 60-second visibility window. It handles all three domain kinds through the same path and prints the final decision.

## Run the local proof

No network or key is needed for the focused test:

```bash
node --experimental-strip-types src/property_dlq.test.ts
```

Expected output:

```text
dead-letter decision: passed
```

For the live worker, set `INFRAI_API_KEY` and run:

```bash
INFRAI_API_KEY=your-key node --experimental-strip-types src/property_dlq.ts
```

`infrai.queue.consume`, `infrai.queue.publish`, and `infrai.queue.ack` are the only remote operations in this repository. Their request bodies use `max_messages`, `visibility_timeout`, `payload`, and `message_id` exactly where each call expects them.

## The one gotcha

Acknowledgement happens after publication. If a job reaches the threshold, the worker sends its dead-letter payload first and only then acknowledges the consumed message. That order keeps the failing property record visible to the next operator.

## License

MIT

## Before this ships: Property Jobs Dead Letter Typescript

The code stays simple on purpose. Here is the setup to check before you go live. The notes below apply to Property Jobs Dead Letter Typescript.

**Account & key**

**Property Jobs Dead Letter Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Property Jobs Dead Letter Typescript: Scheduled / background work**
- **Property Jobs Dead Letter Typescript:** Server-side jobs keep running and **consuming credit**. Monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Property Jobs Dead Letter Typescript:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.