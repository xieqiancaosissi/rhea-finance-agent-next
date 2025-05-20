import { NextResponse, NextRequest } from "next/server";
import { RHEA_LENDING_INTERFACE_DOMAIN } from "@/config";
import Decimal from "decimal.js";
import { expandTokenDecimal } from "@/utils/common";
import { register, validateParams, transferToTranstions } from "@/utils/common";
import { getLendingMatchToken } from "@/utils/search-token";
import { LENDING_SUPPORT_TOKENS_TIP } from "@/utils/constant";
import { get_decrease_collateral_health_factor } from "@/utils/lending";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let token_id = searchParams.get("token_id");
    const amount = searchParams.get("amount");
    const type = searchParams.get("type");
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
        const health_factor_after_decrease =
          await get_decrease_collateral_health_factor({
            token_id,
            amount: amountExpand,
            account_id,
          });
        if (new Decimal(health_factor_after_decrease || 0).lt(100)) {
          return NextResponse.json(
            {
              prompt:
                "Your health factor will be dangerously low and you're at risk of liquidation",
            },
            { status: 200 }
          );
        }
        // Your health factor will be dangerously low and you're at risk of liquidation
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
