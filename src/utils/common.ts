import { utils } from "near-api-js";
import Decimal from "decimal.js";
import { RHEA_LENDING_INTERFACE_DOMAIN } from "@/config";
import { WRAP_NEAR_CONTRACT_ID, BURROW_MAIN_CONTRACT_ID } from "./constant";
interface IResult {
  code: string;
  data: {
    args: Record<string, unknown>;
    contract_id: string;
    method_name: string;
  };
  msg: string;
}
export async function register(account_id: string) {
  const query = await fetch(
    `${RHEA_LENDING_INTERFACE_DOMAIN}/storage_balance_of`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token_id: BURROW_MAIN_CONTRACT_ID,
        account_id,
      }),
    }
  );
  const query_reault = await query.json();
  if (!query_reault.data) {
    const transaction = {
      signerId: account_id,
      receiverId: BURROW_MAIN_CONTRACT_ID,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "storage_deposit",
            args: {
              account_id,
              registration_only: false,
            },
            gas: "100000000000000",
            deposit: utils.format.parseNearAmount("0.1"),
          },
        },
      ],
    };
    return transaction;
  }
  return null;
}

export function validateParams(params: Record<string, string>[]) {
  const empty = params.find((param) => !param.value);
  if (empty) return empty.errorTip;
  return "";
}
export const expandTokenDecimal = (
  value: string | number | Decimal,
  decimals: string | number
): Decimal => {
  return new Decimal(value).mul(new Decimal(10).pow(decimals));
};

export function transferToTranstions(result: IResult, account_id: string) {
  const transaction = {
    signerId: account_id,
    receiverId: result.data.contract_id,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: result.data.method_name,
          args: result.data.args || {},
          gas: "300000000000000",
          deposit: "1",
        },
      },
    ],
  };
  return transaction;
}

export function nearDepositTranstion(account_id: string, amount: string) {
  const transaction = {
    signerId: account_id,
    receiverId: WRAP_NEAR_CONTRACT_ID,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: "near_deposit",
          args: {},
          gas: "100000000000000",
          deposit: utils.format.parseNearAmount(amount),
        },
      },
    ],
  };
  return transaction;
}

export function nearWithdrawTranstion(account_id: string, amount: string) {
  const transaction = {
    signerId: account_id,
    receiverId: WRAP_NEAR_CONTRACT_ID,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: "near_withdraw",
          args: {
            amount: expandTokenDecimal(amount, 24).toFixed(
              0,
              Decimal.ROUND_DOWN
            ),
          },
          gas: "100000000000000",
          deposit: "1",
        },
      },
    ],
  };
  return transaction;
}
export async function registerOnToken(
  account_id: string,
  token_id: string,
  amount?: string
) {
  const query = await fetch(
    `${RHEA_LENDING_INTERFACE_DOMAIN}/storage_balance_of`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token_id,
        account_id,
      }),
    }
  );
  const query_reault = await query.json();
  if (!query_reault.data) {
    const transaction = {
      signerId: account_id,
      receiverId: token_id,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "storage_deposit",
            args: {
              account_id,
              registration_only: true,
            },
            gas: "100000000000000",
            deposit: utils.format.parseNearAmount(amount || "0.1"),
          },
        },
      ],
    };
    return transaction;
  }
  return null;
}
