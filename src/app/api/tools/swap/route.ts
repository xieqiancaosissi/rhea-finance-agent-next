import { NextResponse, NextRequest } from "next/server";
import Decimal from "decimal.js";
import {
  WRAP_NEAR_CONTRACT_ID,
  estimateSwap,
  fetchAllPools,
  ftGetTokenMetadata,
  getStablePools,
  instantSwap,
  nearDepositTransaction,
  nearWithdrawTransaction,
  transformTransactions,
  getPriceImpact,
  getExpectedOutputFromSwapTodos,
} from "rhea-dex-swap-sdk";
import type { EstimateSwapView, Pool } from "rhea-dex-swap-sdk";

import { searchToken } from "@/utils/search-token";
import { getSlippageTolerance } from "@/utils/slippage";

const REFERRAL_ID = "bitte.near";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenIn = searchParams.get("tokenIn");
    const tokenOut = searchParams.get("tokenOut");
    const quantity = searchParams.get("quantity");
    const slippage = searchParams.get("slippage");
    console.log("---------tokenIn", tokenIn);
    console.log("---------tokenOut", tokenOut);
    console.log("---------quantity", quantity);
    console.log("---------slippage", slippage);
    const headersList = request.headers;
    const mbMetadata = JSON.parse(headersList.get("mb-metadata") || "{}");
    const accountId = mbMetadata?.accountId;

    const { ratedPools, unRatedPools, simplePools } = await fetchAllPools();
    const stablePools: Pool[] = unRatedPools.concat(ratedPools);

    // remove low liquidity DEGEN_SWAP pools
    const nonDegenStablePools = stablePools.filter(
      (pool) => pool.pool_kind !== "DEGEN_SWAP"
    );

    const nonDegenStablePoolsDetails = await getStablePools(
      nonDegenStablePools
    );

    const isNearIn = tokenIn!.toLowerCase() === "near";
    const isNearOut = tokenOut!.toLowerCase() === "near";

    const tokenInMatch = searchToken(tokenIn!)[0];
    const tokenOutMatch = searchToken(tokenOut!)[0];
    console.log("--------------------tokenInMatch", tokenInMatch.id);
    console.log("--------------------tokenOutMatch", tokenOutMatch.id);
    if (!tokenInMatch || !tokenOutMatch) {
      return NextResponse.json(
        {
          error: `Unable to find token(s) tokenInMatch: ${tokenInMatch?.name} tokenOutMatch: ${tokenOutMatch?.name}`,
        },
        { status: 500 }
      );
    }

    const [tokenInData, tokenOutData] = await Promise.all([
      ftGetTokenMetadata(tokenInMatch.id),
      ftGetTokenMetadata(tokenOutMatch.id),
    ]);

    if (tokenInData.id === WRAP_NEAR_CONTRACT_ID && isNearOut) {
      return NextResponse.json(
        {
          transactions: transformTransactions(
            [nearWithdrawTransaction(quantity!)],
            accountId
          ),
        },
        { status: 200 }
      );
    }

    if (isNearIn && tokenOutData.id === WRAP_NEAR_CONTRACT_ID) {
      return NextResponse.json(
        {
          transactions: transformTransactions(
            [nearDepositTransaction(quantity!)],
            accountId
          ),
        },
        { status: 200 }
      );
    }

    if (tokenInData.id === tokenOutData.id && isNearIn === isNearOut) {
      return NextResponse.json(
        {
          error: "TokenIn and TokenOut cannot be the same",
        },
        { status: 500 }
      );
    }

    const refEstimateSwap = (enableSmartRouting: boolean) => {
      return estimateSwap({
        tokenIn: tokenInData,
        tokenOut: tokenOutData,
        amountIn: quantity!,
        simplePools,
        options: {
          enableSmartRouting,
          stablePools: nonDegenStablePools,
          stablePoolsDetail: nonDegenStablePoolsDetails,
        },
      });
    };

    const swapTodos: EstimateSwapView[] = await refEstimateSwap(true).catch(
      () => {
        return refEstimateSwap(false); // fallback to non-smart routing if unsupported
      }
    );

    const slippageTolerance = getSlippageTolerance(slippage!);

    const refSwapTransactions = await instantSwap({
      tokenIn: tokenInData,
      tokenOut: tokenOutData,
      amountIn: quantity!,
      swapTodos,
      slippageTolerance,
      AccountId: accountId,
      referralId: REFERRAL_ID,
    });

    if (isNearIn) {
      // wrap near
      refSwapTransactions.unshift(nearDepositTransaction(quantity!));
    }

    if (isNearOut) {
      const lastFunctionCall = refSwapTransactions.at(-1)?.functionCalls.at(-1);

      const args = lastFunctionCall?.args;

      if (args && "msg" in args && typeof args.msg === "string") {
        const argsMsgObj = JSON.parse(args.msg);

        argsMsgObj.skip_unwrap_near = false;

        lastFunctionCall.args = {
          ...lastFunctionCall.args,
          msg: JSON.stringify(argsMsgObj),
        };
      }
    }
    const expectAmountOut = getExpectedOutputFromSwapTodos(
      swapTodos,
      tokenOutData.id
    ).toString();
    const priceImpact = getPriceImpact({
      estimates: swapTodos,
      tokenIn: tokenInData,
      tokenOut: tokenOutData,
      amountIn: quantity!,
      amountOut: expectAmountOut,
      stablePools: nonDegenStablePoolsDetails,
    });
    const priceImpactDisplay =
      new Decimal(priceImpact).toFixed(2, Decimal.ROUND_HALF_CEIL) + "%";
    return NextResponse.json({
      transactions: transformTransactions(refSwapTransactions, accountId),
      priceImpact: priceImpactDisplay,
      prompt: `Before triggering generate-transaction ask the user to the confirm the effects of the transaction priceImpact`,
    });
  } catch (error) {
    console.error("Error swap", error);
    return NextResponse.json({ error: "Failed to swap" }, { status: 500 });
  }
}
