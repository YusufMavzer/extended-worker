# Module extended_worker_threads
This is an open source lightweight layer build on top of `node:worker_threads` module.
It provides a more developer friendly experience to implement true multi threading in node application.

`extended_worker_threads` uses of a **Event Driven Pattern** to make sure that 


## What is the `node:worker_threads` module
The node:worker_threads module enables the use of threads that execute JavaScript in parallel. To access it:

const worker = require('node:worker_threads');
Workers (threads) are useful for performing CPU-intensive JavaScript operations. They do not help much with I/O-intensive work. The Node.js built-in asynchronous I/O operations are more efficient than Workers can be.

## How to implement

- Create/register event handlers
- Create message
- Post message
- Sync results with main thread (optional)


### Create example EventHandler

Create a file `addTenEventHandler.ts` with content. 

```typescript
import { BaseEventHandler, Message } from "@yusufmavzer/extended_worker_threads"

export class AddTenEventHandler implements BaseEventHandler<number, string> {

  canHandle(message: Message<number>): boolean {
    return message.type == "AddTenEvent";
  }

  async handle(message: Message<number>) {
    const n: number = message.payload;
    const result = `Result is ${n + 10}`;

    return new Promise<string>(
      (resolve, reject) => {
        resolve(result);
      }
    });
  }
}
```

Export event(s).
Create a file `eventHandlers.ts`

```typescript

import { BaseEventHandler } from "@yusufmavzer/extended-worker";
import { AddTenEventHandler } from "./addTenEventHandler";

const EventHandlers: Map<string, BaseEventHandler<unknown, unknown>> = new Map();

EventHandlers
  .set("AddTenEvent", new AddTenEventHandler())
  //.set("EventName, Instance");

export default EventHandlers; // exporting it as "default" is IMPORTANT !!!

```

Lastly let post a message

```typescript
import { WorkerThread } from "@yusufmavzer/extended-worker";


// Register the compiled JS file path.
WorkerThread.registerHandlers("dist/events/eventHandlers");

// Create message
const message: Message<number> = {
  type: "AddTenEvent",
  payload: 12
};

// Run without sync main thread
WorkerThread.post<number,string>(message);

// Run with sync main thread
const result = await WorkerThread.post<number,string>(message);

```