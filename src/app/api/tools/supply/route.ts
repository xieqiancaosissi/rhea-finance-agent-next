import { NextResponse, NextRequest } from "next/server";
import Decimal from "decimal.js";
import { RHEA_LENDING_INTERFACE_DOMAIN } from "@/app/config";
import { expandTokenDecimal, wnear_contract_id } from "@/app/utils/common";
import {
  register,
  validateParams,
  transferToTranstions,
  nearDepositTranstion,
} from "@/app/utils/common";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_id = searchParams.get("token_id");
    const amount = searchParams.get("amount");
    const is_collateral = searchParams.get("is_collateral");
    const decimals = searchParams.get("decimals");
    const headersList = request.headers;
    const mbMetadata = JSON.parse(headersList.get("mb-metadata") || "{}");
    const account_id = mbMetadata?.accountId;
    console.log("---------token_id", token_id);
    console.log("---------amount", amount);
    console.log("---------is_collateral", is_collateral);
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
    const register_tx = await register(account_id as string);
    if (register_tx) {
      transactions.push(register_tx);
    }
    if (token_id == wnear_contract_id) {
      const near_deposit_tx = nearDepositTranstion(account_id, amount!);
      transactions.push(near_deposit_tx);
    }
    const res = await fetch(`${RHEA_LENDING_INTERFACE_DOMAIN}/supply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token_id,
        amount: amountExpand,
        is_collateral: is_collateral == "true" ? true : false,
      }),
    });
    const result = await res.json();
    const tx = transferToTranstions(result, account_id);
    transactions.push(tx);
    console.log("---------transactions-----", transactions);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error supply", error);
    return NextResponse.json({ error: "Failed to supply" }, { status: 500 });
  }
}
