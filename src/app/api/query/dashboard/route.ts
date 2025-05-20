import { NextResponse, NextRequest } from "next/server";
import { validateParams } from "@/utils/common";
import { get_account_assets_lending } from "@/utils/lending";

export async function GET(request: NextRequest) {
  try {
    const headersList = request.headers;
    const mbMetadata = JSON.parse(headersList.get("mb-metadata") || "{}");
    const accountId = mbMetadata?.accountId;

    console.log("---------accountId", accountId);

    const errorTip = validateParams([
      {
        value: accountId,
        errorTip: "Need to log in first",
      },
    ]);
    if (errorTip) {
      return NextResponse.json({ data: errorTip }, { status: 200 });
    }
    const dashboard_assets = await get_account_assets_lending(accountId!);

    return NextResponse.json({
      borrowed: dashboard_assets?.borrowed || [],
      supplied: dashboard_assets?.supplied || [],
      collateral: dashboard_assets?.collateral || [],
    });
  } catch (error) {
    console.error("Error get account data", error);
    return NextResponse.json(
      { error: "Failed to get account data" },
      { status: 200 }
    );
  }
}
