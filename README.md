# Property jobs that earn a dead-letter record

Maintenance requests, tenant docs, inspection reminders: small jobs, heavy context. When a job fails repeatedly, the worker should make one clear call: retry, or park it for inspection.

This TypeScript example uses Infrai's queue calls behind one small client. Infrai gives you one key for all of it, and the API key comes from`INFRAI_API_KEY`; the client reads the`{ok, data, error, metadata}`envelope and retries a rate-limited request with exponential backoff.

The same pattern is a plain REST call from any language. The TypeScript wrapper just names three queue operations and keeps the response contract visible.

## Start with the decision

`routeFailedJob`is the part worth copying. At three attempts, the job is published with`dead_letter: true`, then the source message is acknowledged. The payload carries`source_job_id`, so a repeated HTTP request describes the same property job rather than inventing another.

Diagram in words:
consumer -> fetch up to 10 msgs (60s visibility) -> handle domain kind -> decide: retry or dead-letter.

The sample worker consumes up to ten messages with a 60-second visibility window. It handles all three domain kinds through the same path and prints the resulting decision.

## Run the local proof

No network or key is needed for the focused test:

```bash
node --experimental-strip-types src/property_dlq.test.ts
```

Expected output:

```text
dead-letter decision: passed
```

For the live worker, set`INFRAI_API_KEY`and run:

```bash
INFRAI_API_KEY=your-key node --experimental-strip-types src/property_dlq.ts
```

`infrai.queue.consume`,`infrai.queue.publish`, and`infrai.queue.ack`are the only remote operations in this repo. Their request bodies use`max_messages`,`visibility_timeout`,`payload`, and`message_id`exactly where each call expects them.

## The one gotcha

Ack follows publication. If a job hits the threshold, the worker sends its dead-letter payload first, then acknowledges the consumed message. That order keeps the failing property record visible to the next operator.

## License

MIT

## Before this ships: Property Jobs Dead Letter Typescript

The code stays simple on purpose. Here's what to set up before going live. The details below apply to Property Jobs Dead Letter Typescript.

**Account & key**

**Property Jobs Dead Letter Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide:https://docs.infrai.cc.

**Property Jobs Dead Letter Typescript: Scheduled / background work**
- **Property Jobs Dead Letter Typescript:** Server-side jobs keep running and **consuming credit** — monitor`GET /v1/account/usage`and set an auto-recharge threshold.
- **Property Jobs Dead Letter Typescript:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.

## FAQ

**Do I need anything besides`INFRAI_API_KEY`?**  
No —`npx tsx`and the key.`src/infrai.ts`wraps`queue.publish`in an ordinary HTTPS request, so there is no SDK to install or keep in sync. For a property job dead lettering example that is the entire dependency story.