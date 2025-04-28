import { NextResponse, NextRequest } from "next/server";
import { RHEA_LENDING_INTERFACE_DOMAIN } from "@/config";
import Decimal from "decimal.js";
import { expandTokenDecimal } from "@/utils/common";
import {
  register,
  validateParams,
  transferToTranstions,
  wnear_contract_id,
  nearWithdrawTranstion,
} from "@/utils/common";

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
      return NextResponse.json({ data: errorTip }, { status: 200 });
    }
    const max_withdraw_res = await fetch(
      `${RHEA_LENDING_INTERFACE_DOMAIN}/max_withdraw_balance/${account_id}/${token_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const max_withdraw = await max_withdraw_res.json();
    if (Decimal(max_withdraw.data || 0).lt(amount || 0)) {
      return NextResponse.json(
        { data: `The maximum amount you can withdraw is ${max_withdraw.data}` },
        { status: 200 }
      );
    }
    const transactions = [];
    const register_result = await register(account_id as string);
    if (register_result) {
      transactions.push(register_result);
      return NextResponse.json(transactions);
    } else {
      const res = await fetch(`${RHEA_LENDING_INTERFACE_DOMAIN}/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_id,
          account_id,
          amount: amountExpand,
        }),
      });
      const result = await res.json();
      const tx = transferToTranstions(result, account_id);
      transactions.push(tx);
      if (token_id == wnear_contract_id) {
        const near_withdraw_tx = nearWithdrawTranstion(account_id, amount!);
        transactions.push(near_withdraw_tx);
      }
      console.log("---------transactions------", transactions);
      return NextResponse.json(transactions);
    }
  } catch (error) {
    console.error("Error withdraw", error);
    return NextResponse.json({ error: "Failed to withdraw" }, { status: 500 });
  }
}
