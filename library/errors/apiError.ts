export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "PROVIDER_UNAVAILABLE"
  | "BAD_REQUEST";

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;

  constructor(code: ApiErrorCode, message: string, statusCode?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode ?? ApiError.defaultStatusCode(code);
  }

  static defaultStatusCode(code: ApiErrorCode): number {
    switch (code) {
      case "UNAUTHORIZED":
        return 401;
      case "FORBIDDEN":
        return 403;
      case "NOT_FOUND":
        return 404;
      case "CONFLICT":
        return 409;
      case "RATE_LIMITED":
        return 429;
      case "VALIDATION_ERROR":
      case "BAD_REQUEST":
        return 400;
      case "PROVIDER_UNAVAILABLE":
        return 503;
      case "INTERNAL_ERROR":
      default:
        return 500;
    }
  }
}
