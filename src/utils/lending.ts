import { BURROW_FINANCE_DOMAIN_URL } from "./constant";
export async function get_health_factor(accountId: string) {
  const _res = await fetch(
    `${BURROW_FINANCE_DOMAIN_URL}/health_factor/${accountId}`
  ).then((res) => res.json());
  return _res?.data;
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
