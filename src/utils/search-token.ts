import Fuse from "fuse.js";
import type { IFuseOptions } from "fuse.js";

import { allowlistedTokens } from "@/utils/allowlist-tokens";
import type { AllowlistedToken } from "@/utils/allowlist-tokens";
import { getListToken } from "./indexer";
import { support_tokens } from "./tokens";

// Create an array of tokens
const tokens = Object.values(allowlistedTokens);

// Set up the fuse.js options
const options: IFuseOptions<AllowlistedToken> = {
  includeScore: true,
  keys: [
    { name: "name", weight: 0.5 },
    { name: "symbol", weight: 0.3 },
    { name: "id", weight: 0.2 },
  ],
  isCaseSensitive: false,
  threshold: 0.3, // Adjust the threshold for the desired level of fuzziness
};

// Create a new fuse instance
const fuse = new Fuse(tokens, options);

export const searchToken = (query: string): AllowlistedToken[] => {
  if (query.toLowerCase() === "near") return [allowlistedTokens["wrap.near"]];
  // Search the tokens with the query
  const result = fuse.search(query);

  // Map the result to only return the tokens
  return result.map((res) => res.item);
};

export const searchTokenByName = (
  query: string,
  list: Record<string, AllowlistedToken>
): AllowlistedToken[] => {
  if (query.toLowerCase() === "near" || query.toLowerCase() === "wnear")
    return [list["wrap.near"]];
  // Search the tokens with the query
  const result = fuse.search(query);

  // Map the result to only return the tokens
  return result.map((res) => res.item);
};

export async function getMatchTokens(
  tokenInName: string,
  tokenOutName: string
) {
  const tokens = await getListToken();
  const tokenMap = Object.keys(tokens).reduce((acc: any, token_id) => {
    const token = tokens[token_id];
    token.id = token_id;
    acc[token_id] = token;
    return acc;
  }, {});
  const tokenList: AllowlistedToken[] = Object.values(tokenMap);
  let tokenInMetadata: AllowlistedToken;
  let tokenOutMetadata: AllowlistedToken;
  tokenInMetadata = searchTokenByName(tokenInName, tokenMap)?.[0];
  if (!tokenInMetadata) {
    tokenInMetadata = tokenList.find(
      (token: any) =>
        token.id?.toLowerCase() == tokenInName.toLowerCase() ||
        token.symbol?.toLowerCase() == tokenInName.toLowerCase()
    ) as AllowlistedToken;
  }
  tokenOutMetadata = searchTokenByName(tokenOutName, tokenMap)?.[0];
  if (!tokenOutMetadata) {
    tokenOutMetadata = tokenList.find(
      (token: any) =>
        token.id?.toLowerCase() == tokenOutName.toLowerCase() ||
        token.symbol?.toLowerCase() == tokenOutName.toLowerCase()
    ) as AllowlistedToken;
  }
  return [tokenInMetadata, tokenOutMetadata];
}

export function getLendingMatchTokens(tokenName: string) {
  if (
    tokenName.toLowerCase() === "near" ||
    tokenName.toLocaleLowerCase() === "wnear"
  )
    return {
      symbol: "wNEAR",
      token: "wrap.near",
      decimals: 24,
    };
  const matchedToken = support_tokens.find(
    (token) =>
      token.symbol.toLocaleLowerCase() == tokenName.toLocaleLowerCase() ||
      token.token.toLocaleLowerCase() == tokenName.toLocaleLowerCase()
  );
  return matchedToken;
}
