export class UserError extends Error {
  public code: string;
  public detail?: unknown;

  constructor(code: string, message: string, detail?: unknown) {
    super(message);
    this.name = 'UserError';
    this.code = code;
    this.detail = detail;
  }
}

export class DevError extends Error {
  public code: string;
  public detail?: unknown;

  constructor(code: string, message: string, detail?: unknown) {
    super(message);
    this.name = 'DevError';
    this.code = code;
    this.detail = detail;
  }
}
