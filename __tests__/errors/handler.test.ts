/**
 * Tests for the error handler utility.
 * Pure unit tests — no DB or network required.
 */

import { ApiError } from "../../library/errors/apiError";
import { handleApiError } from "../../library/errors/handler";

// Mock NextResponse to avoid needing Next.js in test context
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      _body: body,
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe("ApiError", () => {
  it("sets the correct default status codes", () => {
    expect(new ApiError("UNAUTHORIZED", "test").statusCode).toBe(401);
    expect(new ApiError("FORBIDDEN", "test").statusCode).toBe(403);
    expect(new ApiError("NOT_FOUND", "test").statusCode).toBe(404);
    expect(new ApiError("CONFLICT", "test").statusCode).toBe(409);
    expect(new ApiError("RATE_LIMITED", "test").statusCode).toBe(429);
    expect(new ApiError("VALIDATION_ERROR", "test").statusCode).toBe(400);
    expect(new ApiError("BAD_REQUEST", "test").statusCode).toBe(400);
    expect(new ApiError("INTERNAL_ERROR", "test").statusCode).toBe(500);
    expect(new ApiError("PROVIDER_UNAVAILABLE", "test").statusCode).toBe(503);
  });

  it("allows overriding the status code", () => {
    expect(new ApiError("INTERNAL_ERROR", "test", 418).statusCode).toBe(418);
  });

  it("is an instance of Error", () => {
    expect(new ApiError("NOT_FOUND", "test")).toBeInstanceOf(Error);
  });
});

describe("handleApiError", () => {
  it("converts ApiError to a structured response", async () => {
    const err = new ApiError("NOT_FOUND", "Resource not found.");
    const response = handleApiError(err) as unknown as { _body: unknown; status: number };
    const body = response._body as { success: boolean; error: { code: string; message: string } };

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Resource not found.");
  });

  it("converts unknown errors to 500 in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
    });

    const response = handleApiError(new Error("secret stack trace detail")) as unknown as {
      _body: unknown;
      status: number;
    };
    const body = response._body as { success: boolean; error: { code: string; message: string } };

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    // Should NOT expose the raw error message in production
    expect(body.error.message).not.toContain("secret stack trace detail");

    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalEnv,
      configurable: true,
    });
  });

  it("handles non-Error thrown values", () => {
    const response = handleApiError("string error") as unknown as { status: number };
    expect(response.status).toBe(500);
  });
});
