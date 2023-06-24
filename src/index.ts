import { Worker } from "worker_threads";
import { customEnv } from "./env";
import { EventTask, EventTaskManager } from "./tasks";

let handlersPath: string | undefined = undefined;

export interface Message<TPayload> {
  id?: string;
  type: string;
  payload: TPayload;
}

export interface EventResponse {
  result: any;
  success: boolean;
  reason?: any;
}

export abstract class BaseEventHandler<TPayload, TResponse> {
  abstract canHandle(message: Message<TPayload>): boolean;
  abstract handle(message: Message<TPayload>): Promise<TResponse>;
}

export const WorkerThread = {
  post: <TPayload, TResponse>(message: Message<TPayload>) => {
    if (!handlersPath) {
      throw "No handlers have been registered";
    }
    const msg = message as Message<TPayload> & { handlers: string };
    msg.handlers = handlersPath;
    const eventTask = new EventTask<TPayload, TResponse>(msg);
    EventTaskManager.register(eventTask);
    BackgroundWorker.worker.postMessage(eventTask.message);
    return eventTask.promise;
  },
  registerHandlers: (path: string) => {
    handlersPath = path;
  }
};


class BackgroundWorker {

  private static _instance?: BackgroundWorker;
  private _worker: Worker;

  constructor() {
    let workerPath = `./node_modules/@yusufmavzer/extended_worker_threads/dist/workerThread.js`;
    if (customEnv.EXTENDED_WORKER_TEST == "true") {
      workerPath = "./dist/worker/workerThread.js";
    }
    this._worker = new Worker(workerPath);
    this.init();
  }

  private init() {
    this._worker.on('message', (e: { response: EventResponse, eventTaskId: string }) => {
      if (e.eventTaskId) {
        const task = EventTaskManager.get(e.eventTaskId);
        if (!task) {
          return;
        }
        task.onMessage(e.response);
        EventTaskManager.deregister(e.eventTaskId);
      }
    });

    // Listen for errors from the worker
    this._worker.on('error', (error) => {
      console.error(`Worker error: ${error}`);
    });

    // Listen for the worker to exit
    this._worker.on('exit', (code) => {
      console.log(`Worker exited with code ${code}`);
    });
  }

  public static get worker(): Worker {
    if (!BackgroundWorker._instance) {
      BackgroundWorker._instance = new BackgroundWorker();
    }
    return BackgroundWorker._instance._worker;
  }
}