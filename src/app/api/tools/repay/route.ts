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
    const from = searchParams.get("from");
    const decimals = searchParams.get("decimals");
    const account_id = searchParams.get("account_id");
    console.log("---------token_id", token_id);
    console.log("---------amount", amount);
    console.log("---------from", from);
    console.log("---------decimals", decimals);
    console.log("---------account_id", account_id);
    const amountExpand = expandTokenDecimal(amount || 0, decimals || 0).toFixed(
      0,
      Decimal.ROUND_DOWN
    );
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
      if (from == "wallet") {
        const res = await fetch(
          `${RHEA_LENDING_INTERFACE_DOMAIN}/repay_from_wallet`,
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
        result.gas = "100000000000000";
        return NextResponse.json(result);
      } else if (from == "supplied") {
        const res = await fetch(
          `${RHEA_LENDING_INTERFACE_DOMAIN}/repay_from_supplied`,
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
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    console.error("Error borrow", error);
    return NextResponse.json({ error: "Failed to borrow" }, { status: 500 });
  }
}
