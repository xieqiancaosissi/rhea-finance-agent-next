import { RHEA_LENDING_INTERFACE_DOMAIN } from "@/app/config";

export async function register(account_id: string) {
  return null;
  const query = await fetch(
    `${RHEA_LENDING_INTERFACE_DOMAIN}/storage_balance_of`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token_id: "contract.main.burrow.near",
        account_id,
      }),
    }
  );
  const query_reault = await query.json();
  if (!query_reault.data) {
    const res = await fetch(
      `${RHEA_LENDING_INTERFACE_DOMAIN}/storage_deposit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_id: "contract.main.burrow.near",
          amount: 0.1,
          account_id,
        }),
      }
    );
    const result = await res.json();
    return result;
  }
  return null;
}
