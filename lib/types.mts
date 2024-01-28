export interface Subscription {
  closed: boolean;
  unsubscribe(): void;
}

export interface Subscribable<T> {
  subscribe(
    this: Subscribable<T>,
    next: (value: T) => void,
    error?: () => void,
    complete?: () => void,
  ): Subscription;
  subscribe(this: Subscribable<T>, observer: Observer<T>): Subscription;
}

export interface Observer<T, C = unknown> {
  start?(subscription: Subscription): void;
  next?(value: T): unknown;
  error?(error: unknown): unknown;
  complete?(arg?: C): unknown;
}

export interface SubscriptionObserver<T, C = unknown> extends Observer<T, C> {
  closed: boolean;
}

export interface Subscriber<T, C = unknown> {
  (
    observer: SubscriptionObserver<T, C>,
    // biome-ignore lint/suspicious/noConfusingVoidType: function can return no value too
  ): { unsubscribe(): void } | (() => void) | null | undefined | void;
}

export type HostReportErrors = (error: Error | unknown) => void;
