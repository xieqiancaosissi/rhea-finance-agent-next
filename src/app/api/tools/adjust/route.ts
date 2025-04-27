import { NextResponse, NextRequest } from "next/server";
import { RHEA_LENDING_INTERFACE_DOMAIN } from "@/app/config";
import Decimal from "decimal.js";
import { expandTokenDecimal } from "@/app/utils/tokens";
import { register } from "@/app/utils/common";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_id = searchParams.get("token_id");
    const amount = searchParams.get("amount");
    const type = searchParams.get("type");
    const decimals = searchParams.get("decimals");
    const headersList = request.headers;
    const mbMetadata = JSON.parse(headersList.get("mb-metadata") || "{}");
    const account_id = mbMetadata?.accountId;
    const amountExpand = expandTokenDecimal(amount || 0, decimals || 0).toFixed(
      0,
      Decimal.ROUND_DOWN
    );
    console.log("---------token_id", token_id);
    console.log("---------amount", amount);
    console.log("---------type", type);
    console.log("---------decimals", decimals);
    console.log("---------account_id", account_id);
    if (!account_id) {
      return NextResponse.json(
        { error: "Need to log in first" },
        { status: 400 }
      );
    }
    const register_result = await register(account_id as string);
    if (register_result) {
      return NextResponse.json(register_result);
    } else {
      if (!token_id) {
        return NextResponse.json(
          { error: "token_id parameter is required" },
          { status: 400 }
        );
      }
      if (!decimals) {
        return NextResponse.json(
          { error: "decimals parameter is required" },
          { status: 400 }
        );
      }
      if (type == "increase") {
        const res = await fetch(
          `${RHEA_LENDING_INTERFACE_DOMAIN}/increase_collateral`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token_id,
              amount: amountExpand,
            }),
          }
        );
        const result = await res.json();
        console.log("---------result----increase", result);
        return NextResponse.json(result);
      } else if (type == "decrease") {
        const res = await fetch(
          `${RHEA_LENDING_INTERFACE_DOMAIN}/decrease_collateral`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token_id,
              amount: amountExpand,
            }),
          }
        );
        const result = await res.json();
        console.log("---------result----decrease", result);
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    console.error("Error  token_id:", error);
    return NextResponse.json(
      { error: "Failed to increase collateral" },
      { status: 500 }
    );
  }
}
