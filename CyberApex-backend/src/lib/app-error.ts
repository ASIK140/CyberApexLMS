export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  MFA_REQUIRED: 'MFA_REQUIRED',
  MFA_INVALID: 'MFA_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MAX_ATTEMPTS_REACHED: 'MAX_ATTEMPTS_REACHED',
  ATTEMPT_EXPIRED: 'ATTEMPT_EXPIRED',
  COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',
  ENROLLMENT_EXISTS: 'ENROLLMENT_EXISTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
