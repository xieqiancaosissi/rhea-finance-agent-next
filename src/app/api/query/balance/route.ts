import { NextResponse, NextRequest } from "next/server";
import { getDexMatchToken } from "@/utils/search-token";
import { toReadableNumber } from "@/utils/tools";
import { ftGetBalance } from "rhea-dex-swap-sdk";
import { validateParams } from "@/utils/common";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const headersList = request.headers;
    const mbMetadata = JSON.parse(headersList.get("mb-metadata") || "{}");
    const accountId = mbMetadata?.accountId;

    console.log("---------token", token);
    console.log("---------accountId", accountId);

    const errorTip = validateParams([
      {
        value: accountId,
        errorTip: "Need to log in first",
      },
      {
        value: token,
        errorTip: "token_id parameter is required",
      },
    ]);
    if (errorTip) {
      return NextResponse.json({ data: errorTip }, { status: 200 });
    }
    const tokenMetadata = await getDexMatchToken(token!);
    if (!tokenMetadata) {
      return NextResponse.json(
        {
          error: `Unable to find token(s) ${token}`,
        },
        { status: 200 }
      );
    }
    const _res = await ftGetBalance(tokenMetadata.id, accountId);
    const balance = toReadableNumber(tokenMetadata.decimals, _res);
    return NextResponse.json({
      balance,
    });
  } catch (error) {
    console.error("Error balance", error);
    return NextResponse.json(
      { data: "Failed to query balance", error },
      { status: 200 }
    );
  }
}
