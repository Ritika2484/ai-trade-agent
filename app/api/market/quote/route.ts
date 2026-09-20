import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "../../../../library/auth/middleware";
import { getMarketDataProvider } from "../../../../library/market/provider";
import { handleApiError } from "../../../../library/errors/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  symbol: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Symbol is required.")
    .max(10, "Symbol must be 10 characters or fewer."),
});

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({ symbol: searchParams.get("symbol") });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid symbol." },
        },
        { status: 400 },
      );
    }

    const provider = getMarketDataProvider();
    const result = await provider.getQuote(parsed.data.symbol);

    if (!result.configured) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: { code: "PROVIDER_UNAVAILABLE", message: result.reason },
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, configured: true, quote: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}
