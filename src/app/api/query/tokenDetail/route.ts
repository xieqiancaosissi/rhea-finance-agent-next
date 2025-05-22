import { NextResponse } from "next/server";
import { get_list_token_data } from "@/utils/lending";

export async function GET() {
  try {
    const tokenDetails = await get_list_token_data();
    return NextResponse.json(tokenDetails);
  } catch (error) {
    console.error("Error token list", error);
    return NextResponse.json(
      { error: "Failed to query token list" },
      { status: 200 }
    );
  }
}
