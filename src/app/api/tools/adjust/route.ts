import { NextResponse, NextRequest } from "next/server";
import { RHEA_LENDING_INTERFACE_DOMAIN } from "@/config";
import Decimal from "decimal.js";
import { expandTokenDecimal } from "@/utils/common";
import { register, validateParams, transferToTranstions } from "@/utils/common";

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
    const register_tx = await register(account_id as string);
    if (register_tx) {
      transactions.push(register_tx);
      return NextResponse.json(transactions);
    } else {
      const max_adjust_res = await fetch(
        `${RHEA_LENDING_INTERFACE_DOMAIN}/max_adjust_balance/${account_id}/${token_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const max_adjust = await max_adjust_res.json();
      const { data, collateral_data } = max_adjust;
      const un_collateral_data = new Decimal(data || 0).minus(
        collateral_data || 0
      );
      // console.log('-------------collateral_data', collateral_data);
      // console.log('-------------un_collateral_data', un_collateral_data.toFixed());
      if (type == "increase") {
        if (new Decimal(un_collateral_data).lt(amount || 0)) {
          return NextResponse.json(
            {
              data: `You can increase the maximum amount by up to ${un_collateral_data.toFixed(
                5
              )}`,
            },
            { status: 200 }
          );
        }
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
        const tx = transferToTranstions(result, account_id);
        transactions.push(tx);
        console.log("---------transactions----increase", result);
        return NextResponse.json(transactions);
      } else if (type == "decrease") {
        if (new Decimal(collateral_data).lt(amount || 0)) {
          return NextResponse.json(
            {
              data: `You can decrease the maximum amount by up to ${new Decimal(
                collateral_data || 0
              ).toFixed(5)}`,
            },
            { status: 200 }
          );
        }
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
        const tx = transferToTranstions(result, account_id);
        transactions.push(tx);
        console.log("---------transactions----decrease", result);
        return NextResponse.json(transactions);
      }
    }
  } catch (error) {
    console.error("Error adjust collateral", error);
    return NextResponse.json(
      { error: "Failed to adjust collateral" },
      { status: 500 }
    );
  }
}
