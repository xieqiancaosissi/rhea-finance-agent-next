import { NextResponse, NextRequest } from "next/server";
import { RHEA_LENDING_INTERFACE_DOMAIN } from "@/app/config";
import Decimal from "decimal.js";
import { expandTokenDecimal } from "@/app/utils/tokens";
import {
  register,
  validateParams,
  transferToTranstions,
} from "@/app/utils/common";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_id = searchParams.get("token_id");
    const amount = searchParams.get("amount");
    const decimals = searchParams.get("decimals");
    const headersList = request.headers;
    const mbMetadata = JSON.parse(headersList.get("mb-metadata") || "{}");
    const account_id = mbMetadata?.accountId;
    console.log("---------token_id", token_id);
    console.log("---------amount", amount);
    console.log("---------decimals", decimals);
    console.log("---------account_id", account_id);
    const amountExpand = expandTokenDecimal(amount || 0, decimals || 0).toFixed(
      0,
      Decimal.ROUND_DOWN
    );
    const errorTip = validateParams([
      {
        value: account_id,
        errorTip: "Need to log in first",
      },
      {
        value: token_id,
        errorTip: "token_id parameter is required",
      },
      {
        value: decimals,
        errorTip: "decimals parameter is required",
      },
    ]);
    if (errorTip) {
      return NextResponse.json({ error: errorTip }, { status: 400 });
    }
    const transactions = [];
    const register_result = await register(account_id as string);
    if (register_result) {
      transactions.push(register_result);
      return NextResponse.json(transactions);
    } else {
      const res = await fetch(`${RHEA_LENDING_INTERFACE_DOMAIN}/burrow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_id,
          amount: amountExpand,
        }),
      });
      const result = await res.json();
      const tx = transferToTranstions(result, account_id);
      transactions.push(tx);
      console.log("---------transactions------", transactions);
      return NextResponse.json(transactions);
    }
  } catch (error) {
    console.error("Error borrow", error);
    return NextResponse.json({ error: "Failed to borrow" }, { status: 500 });
  }
}
