declare global {
  interface SymbolConstructor {
    /**
     * A method that returns the default observable for an object.
     */
    readonly observable: unique symbol;
  }
}

!Symbol.observable &&
  Object.assign(Symbol, {
    observable: Symbol(),
  });
