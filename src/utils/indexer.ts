import { INDEXER_DOMAIN_URL, SMART_ROUTER_DOMAIN_URL } from "./constant";
export async function getListToken() {
  const list_token = await fetch(`${INDEXER_DOMAIN_URL}/list-token`).then(
    (res) => res.json()
  );
  return list_token;
}
export async function fetchAllPools() {
  const res = await fetch(`${INDEXER_DOMAIN_URL}/fetchAllPools`).then((res) =>
    res.json()
  );
  return res;
}
export async function getTokenPriceList() {
  const res = await fetch(`${INDEXER_DOMAIN_URL}/list-token-price`).then(
    (res) => res.json()
  );
  return res;
}
export async function findPath({
  amountIn,
  tokenInId,
  tokenOutId,
  slippage,
}: {
  amountIn: string;
  tokenInId: string;
  tokenOutId: string;
  slippage: string | number;
}) {
  const res = await fetch(
    `${SMART_ROUTER_DOMAIN_URL}/findPath?amountIn=${amountIn}&tokenIn=${tokenInId}&tokenOut=${tokenOutId}&slippage=${slippage}&pathDeep=3`
  ).then((res) => {
    return res.json();
  });
  return res;
}

export async function fetchUserPoints(accountId: string) {
  const res = await fetch(
    `${INDEXER_DOMAIN_URL}/v3/points/user?addr=${accountId}`
  ).then((res) => res.json());
  return {
    last_liquidity_points: res.data.last_liquidity_points,
    liquidity_points: res.data.liquidity_points,
    trade_points: res.data.trade_points,
    total_points: res.data.total_points,
  };
}
