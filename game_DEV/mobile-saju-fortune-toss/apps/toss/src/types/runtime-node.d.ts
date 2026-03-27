declare var process: {
  argv: string[];
  env: Record<string, string | undefined>;
};

declare var require: {
  (id: string): any;
  context?: (path: string, useSubdirectories: boolean, regExp: RegExp) => unknown;
};
