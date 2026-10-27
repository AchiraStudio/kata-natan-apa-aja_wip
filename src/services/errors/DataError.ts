export type DataErrorKind =
  | 'network'
  | 'auth'
  | 'permission'
  | 'validation'
  | 'not_found'
  | 'conflict';

export class DataError extends Error {
  public readonly kind: DataErrorKind;
  public readonly originalError?: unknown;

  constructor(kind: DataErrorKind, message: string, originalError?: unknown) {
    super(message);
    this.name = 'DataError';
    this.kind = kind;
    this.originalError = originalError;
    Object.setPrototypeOf(this, DataError.prototype);
  }

  public static isDataError(error: unknown): error is DataError {
    return error instanceof DataError;
  }
}
