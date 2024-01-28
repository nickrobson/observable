import { Subscription } from "./Subscription.mjs";
import { SubscriptionObserver } from "./SubscriptionObserver.mjs";
import "./polyfill.mjs";
import { Observer, Subscribable, Subscriber } from "./types.mjs";

interface AnyObservable<T> {
  [Symbol.observable](): Subscribable<T>;
}

export class Observable<T> implements Subscribable<T>, AnyObservable<T> {
  private _subscriber: Subscriber<T>;

  constructor(subscriber: Subscriber<T>) {
    if (typeof subscriber !== "function") {
      throw new TypeError(`${subscriber} is not a function`);
    }
    this._subscriber = subscriber;
  }

  [Symbol.observable]() {
    return this;
  }

  subscribe(
    observerOrNextCallback: Observer<T> | ((next: T) => void),
    ...args: [
      errorCallback?: (error: unknown) => void,
      completeCallback?: () => void,
    ]
  ) {
    if (typeof this !== "object") {
      throw new TypeError(`${this} is not an object`);
    }
    if (!this._subscriber) {
      throw new TypeError("no subscriber");
    }

    let observer: Observer<T>;
    if (typeof observerOrNextCallback === "function") {
      const next = observerOrNextCallback;
      const [error, complete] = args;
      observer = {
        next,
        error,
        complete,
      };
    } else if (
      observerOrNextCallback == null ||
      typeof observerOrNextCallback !== "object"
    ) {
      throw new TypeError(`${observerOrNextCallback} is not an object`);
    } else {
      observer = observerOrNextCallback;
    }

    return new Subscription(observer, this._subscriber);
  }

  static from<T>(x: AnyObservable<T> | Iterable<T>) {
    const ObservableConstructor =
      // biome-ignore lint/complexity/noThisInStatic: Observable.from uses this if it's a function type
      typeof this === "function" ? this : Observable;

    if (x == null) {
      throw new TypeError(`${x} is nullish`);
    }

    let subscriber: Subscriber<T>;

    if (Symbol.observable in x) {
      const observableGetter = x[Symbol.observable];
      if (typeof observableGetter !== "function") {
        throw TypeError("not an observable");
      }

      const observable = observableGetter();
      if (typeof observable !== "object" && typeof observable !== "function") {
        throw TypeError(`${observable} is not an object or function`);
      }

      if (observable.constructor === ObservableConstructor) {
        return observable;
      }

      subscriber = (observer) => observable.subscribe(observer);
    } else {
      subscriber = (observer) => {
        for (const value of x) {
          observer.next?.(value);

          if (observer.closed) {
            return;
          }
        }

        observer.complete?.();
      };
    }
    return new ObservableConstructor<T>(subscriber);
  }

  static of<T>(...values: readonly T[]) {
    const ObservableConstructor =
      // biome-ignore lint/complexity/noThisInStatic: Observable.of uses this if it's a function type
      typeof this === "function" ? this : Observable;

    return new ObservableConstructor<T>((observer) => {
      for (const value of values) {
        observer.next?.(value);
        if (observer.closed) {
          return;
        }
      }
      observer.complete?.();
    });
  }
}
