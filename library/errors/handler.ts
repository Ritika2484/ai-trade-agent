import { NextResponse } from "next/server";
import { ApiError } from "./apiError";

const isDev = process.env.NODE_ENV === "development";

/**
 * Standard API response shape for errors:
 * { success: false, error: { code: string, message: string } }
 */
export function apiErrorResponse(
  code: string,
  message: string,
  statusCode: number,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status: statusCode },
  );
}

/**
 * Standard API response shape for success:
 * { success: true, data: T }
 */
export function apiSuccessResponse<T>(
  data: T,
  statusCode = 200,
): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status: statusCode });
}

/**
 * Centralised handler — converts any thrown value to a structured NextResponse.
 * Never exposes stack traces in production.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    serverLog("warn", error.code, error.message);
    return apiErrorResponse(error.code, error.message, error.statusCode);
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  // Only log stack in dev
  if (isDev && error instanceof Error) {
    console.error("[API Error]", error.stack);
  } else {
    serverLog("error", "INTERNAL_ERROR", message);
  }

  // Never expose internals in production
  const publicMessage = isDev
    ? message
    : "An internal server error occurred. Please try again later.";

  return apiErrorResponse("INTERNAL_ERROR", publicMessage, 500);
}

function serverLog(level: "warn" | "error", code: string, message: string) {
  const entry = JSON.stringify({
    level,
    code,
    message,
    timestamp: new Date().toISOString(),
  });
  if (level === "error") {
    console.error(entry);
  } else {
    console.warn(entry);
  }
}
