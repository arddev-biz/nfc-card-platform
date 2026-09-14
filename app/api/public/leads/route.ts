import { NextRequest, NextResponse } from "next/server";
import { leadSubmissionSchema } from "@/lib/validation/leads";
import { createLead } from "@/lib/services/leads";
import { checkRateLimit } from "@/lib/auth/rateLimit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = checkRateLimit(`lead-submit:${ip}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 600) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = leadSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    await createLead(parsed.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong submitting your request. Please try again." },
      { status: 500 }
    );
  }
}
