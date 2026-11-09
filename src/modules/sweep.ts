/**
 * sweep — f1-c DustSweeper. Pulls full token balances via Permit2 and one-hops each to USDC,
 * straight to the caller. The user must have approved Permit2 per token first (out of SDK scope).
 */
import * as buildCallData from "../buildCallData.js";
import type { SweepHop } from "../buildCallData.js";
import { simulate, type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";

export type { SweepHop };

export interface SweepArgs {
  sweeper: Address;
  tokens: readonly Address[];
  hops: readonly SweepHop[];
  minOut: readonly bigint[];
  account?: Address;
}

export function sweepCallData(args: SweepArgs) {
  return buildCallData.sweep(args);
}

export async function sweep(client: FleetClient, args: SweepArgs): Promise<Hex> {
  const cd = sweepCallData(args);
  await simulate(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
  if (!client.walletClient) throw new Error("sweep: client has no walletClient/account");
  return client.walletClient.sendTransaction({
    to: cd.to,
    data: cd.data,
    value: 0n,
    account: client.walletClient.account ?? null,
    chain: client.walletClient.chain ?? null,
  });
}
