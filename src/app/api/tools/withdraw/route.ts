import { NextResponse, NextRequest } from "next/server";
import { RHEA_LENDING_INTERFACE_DOMAIN } from "@/config";
import Decimal from "decimal.js";
import { expandTokenDecimal } from "@/utils/common";
import { WRAP_NEAR_CONTRACT_ID } from "@/utils/constant";
import {
  register,
  validateParams,
  transferToTranstions,
  nearWithdrawTranstion,
  registerOnToken,
} from "@/utils/common";
import { getLendingMatchToken } from "@/utils/search-token";
import { LENDING_SUPPORT_TOKENS_TIP } from "@/utils/constant";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let token_id = searchParams.get("token_id");
    const amount = searchParams.get("amount");
    const headersList = request.headers;
    const mbMetadata = JSON.parse(headersList.get("mb-metadata") || "{}");
    const account_id = mbMetadata?.accountId;
    const errorTip = validateParams([
      {
        value: account_id,
        errorTip: "Need to log in first",
      },
      {
        value: token_id,
        errorTip: "token_id parameter is required",
      },
    ]);
    if (errorTip) {
      return NextResponse.json({ data: errorTip }, { status: 200 });
    }
    const token = getLendingMatchToken(token_id!);
    if (!token) {
      return NextResponse.json(
        {
          prompt: LENDING_SUPPORT_TOKENS_TIP,
        },
        { status: 200 }
      );
    }
    token_id = token.token;
    const decimals = token.decimals;
    const amountExpand = expandTokenDecimal(amount || 0, decimals || 0).toFixed(
      0,
      Decimal.ROUND_DOWN
    );
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
    // register on contract
    if (register_result) {
      transactions.push(register_result);
      return NextResponse.json(transactions);
    } else {
      const register_token_result = await registerOnToken(
        account_id,
        token_id,
        "0.00125"
      );
      if (register_token_result) {
        transactions.push(register_token_result);
      }
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
      if (token_id == WRAP_NEAR_CONTRACT_ID) {
        const near_withdraw_tx = nearWithdrawTranstion(account_id, amount!);
        transactions.push(near_withdraw_tx);
      }
      return NextResponse.json(transactions);
    }
  } catch (error) {
    console.error("Error withdraw", error);
    return NextResponse.json({ error: "Failed to withdraw" }, { status: 500 });
  }
}
