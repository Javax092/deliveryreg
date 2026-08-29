import { NextResponse } from "next/server";

import { env } from "@/config/env";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timezone: env.BUSINESS_TIMEZONE
  });
}
