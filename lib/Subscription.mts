import { SubscriptionObserver } from "./SubscriptionObserver.mjs";
import { hostReportErrors } from "./hostReportErrors.mjs";
import { Observer, Subscriber } from "./types.mjs";

export class Subscription {
  private _observer: Observer<unknown> | undefined;
  private _cleanup: (() => void) | undefined;

  constructor(observer: Observer<unknown>, subscriber: Subscriber<unknown>) {
    this._observer = observer;
    this._cleanup = undefined;

    try {
      observer.start?.(this);
    } catch (err) {
      hostReportErrors(err);
      this.unsubscribe();
    }

    if (this.closed) {
      return;
    }

    const subscriptionObserver = new SubscriptionObserver(this, observer);

    try {
      const cleanup = subscriber(subscriptionObserver);
      if (cleanup != null) {
        if (
          "unsubscribe" in cleanup &&
          typeof cleanup.unsubscribe === "function"
        ) {
          this._cleanup = cleanup.unsubscribe;
        } else if (typeof cleanup === "function") {
          this._cleanup = cleanup;
        } else {
          throw new TypeError(`${cleanup} is not a function`);
        }
      }
    } catch (err) {
      subscriptionObserver.error(err);
      return;
    }

    if (this.closed) {
      this.cleanup();
    }
  }

  get closed(): boolean {
    return this._observer === undefined;
  }

  unsubscribe(): void {
    if (this.closed) {
      return;
    }

    this.close();
    this.cleanup();
  }

  close(): void {
    this._observer = undefined;
  }

  cleanup(): void {
    const cleanup = this._cleanup;
    if (cleanup === undefined) {
      return;
    }
    this._cleanup = undefined;
    try {
      cleanup();
    } catch (err) {
      hostReportErrors(err);
    }
  }
}
