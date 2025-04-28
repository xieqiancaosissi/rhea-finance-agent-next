import { NextResponse, NextRequest } from "next/server";
import { RHEA_LENDING_INTERFACE_DOMAIN } from "@/config";
import Decimal from "decimal.js";
import { expandTokenDecimal } from "@/utils/common";
import {
  register,
  validateParams,
  transferToTranstions,
  wnear_contract_id,
  nearDepositTranstion,
} from "@/utils/common";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_id = searchParams.get("token_id");
    const amount = searchParams.get("amount");
    const from = searchParams.get("from");
    const decimals = searchParams.get("decimals");
    const headersList = request.headers;
    const mbMetadata = JSON.parse(headersList.get("mb-metadata") || "{}");
    const account_id = mbMetadata?.accountId;
    console.log("---------token_id", token_id);
    console.log("---------amount", amount);
    console.log("---------from", from);
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
    const transactions = [];
    const register_result = await register(account_id as string);
    if (register_result) {
      transactions.push(register_result);
      return NextResponse.json(transactions);
    } else {
      if (from == "wallet") {
        const max_repay_from_wallet_res = await fetch(
          `${RHEA_LENDING_INTERFACE_DOMAIN}/max_repay_from_wallet/${account_id}/${token_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const max_repay = await max_repay_from_wallet_res.json();
        if (Decimal(max_repay.data || 0).lt(amount || 0)) {
          return NextResponse.json(
            { data: `The maximum amount you can repay is ${max_repay.data}` },
            { status: 200 }
          );
        }
        if (token_id == wnear_contract_id) {
          const near_deposit_tx = nearDepositTranstion(account_id, amount!);
          transactions.push(near_deposit_tx);
        }
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
        const tx = transferToTranstions(result, account_id);
        transactions.push(tx);
        console.log("---------transactions------", transactions);
        return NextResponse.json(transactions);
      } else if (from == "supplied") {
        const max_repay_from_account_res = await fetch(
          `${RHEA_LENDING_INTERFACE_DOMAIN}/max_repay_from_account/${account_id}/${token_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const max_repay = await max_repay_from_account_res.json();
        if (Decimal(max_repay.data || 0).lt(amount || 0)) {
          return NextResponse.json(
            { data: `The maximum amount you can repay is ${max_repay.data}` },
            { status: 200 }
          );
        }
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
              account_id,
            }),
          }
        );

        const result = await res.json();
        const tx = transferToTranstions(result, account_id);
        transactions.push(tx);
        console.log("---------transactions------", transactions);
        return NextResponse.json(transactions);
      }
    }
  } catch (error) {
    console.error("Error repay", error);
    return NextResponse.json({ error: "Failed to repay" }, { status: 500 });
  }
}
