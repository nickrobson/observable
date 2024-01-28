import { Subscription } from "./Subscription.mjs";
import { hostReportErrors } from "./hostReportErrors.mjs";
import {
  SubscriptionObserver as ISubscriptionObserver,
  Observer,
} from "./types.mjs";

export class SubscriptionObserver<T, C = unknown>
  implements ISubscriptionObserver<T, C>
{
  private _subscription: Subscription;
  private _observer: Observer<T>;

  constructor(subscription: Subscription, observer: Observer<T, C>) {
    this._subscription = subscription;
    this._observer = observer;
  }

  get closed(): boolean {
    return this._subscription.closed;
  }

  start(subscription: Subscription): void {
    this._observer.start?.(subscription);
  }

  next(value: T): unknown {
    if (this.closed) {
      return;
    }

    try {
      return this._observer.next?.(value);
    } catch (error) {
      try {
        this._subscription.close();
        this._subscription.cleanup();
      } catch (cleanupErr) {}
      throw error;
    }
  }

  error(error: unknown): unknown {
    if (this.closed) {
      throw error;
    }

    try {
      this._subscription.close();
      const errorFn = this._observer.error;
      if (typeof errorFn === "function") {
        const completion = errorFn(error);
        this._subscription.cleanup();
        return completion;
      }
      if (errorFn == null) {
        throw error;
      }
      throw new TypeError(`${errorFn} is not a function`);
    } catch (err) {
      try {
        this._subscription.cleanup();
      } catch (cleanupError) {}
      hostReportErrors(err);
    }
  }

  complete(arg?: unknown): unknown {
    if (this.closed) {
      return;
    }

    try {
      this._subscription.close();
      const completion = this._observer.complete?.(arg);
      this._subscription.cleanup();
      return completion;
    } catch (error) {
      try {
        this._subscription.cleanup();
      } catch (cleanupError) {}
      hostReportErrors(error);
    }
  }
}
