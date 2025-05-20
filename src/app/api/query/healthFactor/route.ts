import { NextResponse, NextRequest } from "next/server";
import { validateParams } from "@/utils/common";
import { get_health_factor } from "@/utils/lending";

export async function GET(request: NextRequest) {
  try {
    const headersList = request.headers;
    const mbMetadata = JSON.parse(headersList.get("mb-metadata") || "{}");
    const accountId = mbMetadata?.accountId;
    const errorTip = validateParams([
      {
        value: accountId,
        errorTip: "Need to log in first",
      },
    ]);
    if (errorTip) {
      return NextResponse.json({ data: errorTip }, { status: 200 });
    }
    const health_factor = await get_health_factor(accountId!);
    return NextResponse.json({
      health_factor: `${health_factor}%`,
    });
  } catch (error) {
    console.error("Error get health factor", error);
    return NextResponse.json(
      { error: "Failed to get health factor" },
      { status: 200 }
    );
  }
}
