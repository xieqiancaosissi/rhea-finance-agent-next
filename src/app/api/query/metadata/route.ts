import { NextResponse, NextRequest } from "next/server";
import { getDexMatchToken } from "@/utils/search-token";
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
    return NextResponse.json({
      ...tokenMetadata,
    });
  } catch (error) {
    console.error("Error balance", error);
    return NextResponse.json(
      { error: "Failed to query balance" },
      { status: 200 }
    );
  }
}
