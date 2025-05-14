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
} from "@/utils/common";
import { getLendingMatchTokens } from "@/utils/search-token";
import { LENDING_SUPPORT_TOKENS_TIP } from "@/utils/constant";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let token_id = searchParams.get("token_id");
    const amount = searchParams.get("amount");
    const headersList = request.headers;
    const mbMetadata = JSON.parse(headersList.get("mb-metadata") || "{}");
    const account_id = mbMetadata?.accountId;
    console.log("---------token_id", token_id);
    console.log("---------amount", amount);
    console.log("---------account_id", account_id);

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
    const token = getLendingMatchTokens(token_id!);
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
    console.log("---------decimals, token_id", decimals, token_id);
    const max_burrow_res = await fetch(
      `${RHEA_LENDING_INTERFACE_DOMAIN}/max_burrow_balance/${account_id}/${token_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const max_borrow = await max_burrow_res.json();
    if (Decimal(max_borrow.data || 0).lt(amount || 0)) {
      return NextResponse.json(
        { data: `The maximum amount you can borrow is ${max_borrow.data}` },
        { status: 200 }
      );
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
      if (token_id == WRAP_NEAR_CONTRACT_ID) {
        const near_withdraw_tx = nearWithdrawTranstion(account_id, amount!);
        transactions.push(near_withdraw_tx);
      }
      console.log("---------transactions------", transactions);
      return NextResponse.json(transactions);
    }
  } catch (error) {
    console.error("Error borrow", error);
    return NextResponse.json({ error: "Failed to borrow" }, { status: 500 });
  }
}
