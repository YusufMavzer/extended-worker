import * as Path from "path";
import { parentPort } from "worker_threads";
import { Message, BaseEventHandler } from ".";
import { customEnv } from "./env";

let eventHandlers: Map<string, BaseEventHandler<unknown, unknown>> = new Map();

parentPort && parentPort.on('message', async (message: Message<unknown> & { handlers: string }) => {
  await registerHandlers(message.handlers);

  //handlers loop;
  const keys = Array.from(eventHandlers.keys());
  let foundEvent: boolean = false;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const eventHandler = eventHandlers.get(key)!;
    if (eventHandler.canHandle(message)) {
      foundEvent = true;
      try {
        const result = await eventHandler.handle(message);
        parentPort && parentPort.postMessage({
          response: {
            result,
            success: true,
          },
          eventTaskId: message.id
        });
      } catch (reason) {
        parentPort && parentPort.postMessage({
          response: {
            result: null,
            reason,
            success: false,
          },
          eventTaskId: message.id
        });
      }
      finally {
        return;
      }
    }
  }
  //unknown event
  if (!foundEvent) {
    parentPort && parentPort.postMessage({
      response: {
        result: null,
        reason: `No EventHandlers found for message type ${message.type}!`,
        success: false,
      },
      eventTaskId: message.id
    });
  }

});

async function registerHandlers(handlersPath: string) {
  let rootDir = Path.resolve(__dirname, "../../../../");;
  if (customEnv.EXTENDED_WORKER_TEST == "true") {
    rootDir = __dirname
  }
  const resolvedPath = Path.join(rootDir, handlersPath);
  const handlers = (await import(resolvedPath)).default as Map<string, BaseEventHandler<unknown, unknown>>;
  eventHandlers = new Map([...eventHandlers, ...handlers]);
}
