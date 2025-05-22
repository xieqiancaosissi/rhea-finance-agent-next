import { NextResponse } from "next/server";
import { fetchTopTokens } from "@/utils/indexer";

export async function GET() {
  try {
    const tokenTokenDetails = await fetchTopTokens();
    return NextResponse.json(tokenTokenDetails);
  } catch (error) {
    console.error("Error top token list", error);
    return NextResponse.json(
      { error: "Failed to query top token list" },
      { status: 200 }
    );
  }
}
