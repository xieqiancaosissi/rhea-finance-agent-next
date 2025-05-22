import axios from "axios";
import { BURROW_FINANCE_DOMAIN_URL } from "./constant";
import Decimal from "decimal.js";
export async function get_health_factor(accountId: string) {
  const { data } = await axios(
    `${BURROW_FINANCE_DOMAIN_URL}/health_factor/${accountId}`
  );
  return data.data;
}

export async function get_account_assets_lending(accountId: string) {
  const _res = await fetch(
    `${BURROW_FINANCE_DOMAIN_URL}/get_account/${accountId}`
  ).then((res) => res.json());
  return _res?.data;
}

export async function get_decrease_collateral_health_factor({
  token_id,
  amount,
  account_id,
}: {
  token_id: string;
  amount: string;
  account_id: string;
}) {
  const _res = await fetch(
    `${BURROW_FINANCE_DOMAIN_URL}/decrease_collateral_health_factor`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token_id,
        amount,
        account_id,
      }),
    }
  ).then((res) => res.json());
  return _res?.data;
}

export async function get_list_token_data() {
  const incentiveToken: any = {
    "853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near": {
      token: "853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near",
      symbol: "FRAX",
    },
    "usdt.tether-token.near": {
      token: "usdt.tether-token.near",
      symbol: "USDt",
    },
    "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1": {
      token: "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
      symbol: "USDC",
    },
    "zec.omft.near": {
      token: "zec.omft.near",
      symbol: "ZEC",
    },
  };
  const hiddenAssets = [
    "meta-token.near",
    "usn",
    "a663b02cf0a4b149d2ad41910cb81e23e1c41c32.factory.bridge.near",
    "4691937a7508860f876c9c0a2a617e7d9e945d4b.factory.bridge.near",
    "v2-nearx.stader-labs.near",
    "aurora",
  ];
  const _res = await fetch(`${BURROW_FINANCE_DOMAIN_URL}/list_token_data`).then(
    (res) => res.json()
  );
  const list = _res?.data.filter((t: any) => !hiddenAssets.includes(t.token));
  const newList = list.map((t: any) => {
    const newT: any = {};
    newT.supply_apy = new Decimal(t.supply_apy || 0)
      .plus(t.net_apy || 0)
      .plus(t.net_liquidity_apy || 0)
      .plus(t.supply_farm_apy || 0)
      .toFixed();
    newT.borrow_apy = t.borrow_apy;
    newT.symbol = t.symbol;
    newT.token = t.token as string;
    newT.price = t.price;
    newT.isIncentive = !!incentiveToken[t.token];
    return newT;
  });
  return newList;
}
