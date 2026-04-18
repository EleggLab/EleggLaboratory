declare function require(id: string): any;

declare namespace require {
  function context(directory: string): any;
}
