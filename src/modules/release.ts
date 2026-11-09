/**
 * release — settle an escrow child (release/refund) and read its terminal outcome.
 *
 * Note: `release` targets the ESCROW CHILD address (`IStreamRail`/`IEscrowRail` factory produce a
 * per-deal child), not the factory. `outcome()` is the honest discriminator — `settled` is true
 * after EITHER leg (audit M-3), so a reader that needs "the counterparty was PAID" checks `== 1`.
 */
import { decodeFunctionResult } from "viem";
import { escrowAbi } from "../abi.js";
import * as buildCallData from "../buildCallData.js";
import { simulate, type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";

/** outcome() codes — mirror IEscrowRail: 0 open, 1 released, 2 refunded. */
export const OUTCOME = { OPEN: 0, RELEASED: 1, REFUNDED: 2 } as const;

export interface ReleaseArgs {
  escrow: Address;
  /** keccak(preimage); the hashlock key for a hashlocked deal (bytes32(0) for arbiter-only). */
  preimage: Hex;
  account?: Address;
}

export function releaseCallData(args: Pick<ReleaseArgs, "escrow" | "preimage">) {
  return buildCallData.release(args);
}

/** Read the terminal outcome of an escrow (0 open, 1 released, 2 refunded). */
export async function outcome(client: FleetClient, args: { escrow: Address }): Promise<number> {
  const cd = buildCallData.outcome(args);
  const { result } = await simulate(client, { to: cd.to, data: cd.data });
  return Number(decodeFunctionResult({ abi: escrowAbi, functionName: "outcome", data: result }) as number);
}

export async function release(client: FleetClient, args: ReleaseArgs): Promise<Hex> {
  const cd = releaseCallData(args);
  await simulate(client, {
    to: cd.to,
    data: cd.data,
    ...(args.account ? { account: args.account } : {}),
  });
  if (!client.walletClient) throw new Error("release: client has no walletClient/account");
  return client.walletClient.sendTransaction({
    to: cd.to,
    data: cd.data,
    value: 0n,
    account: client.walletClient.account ?? null,
    chain: client.walletClient.chain ?? null,
  });
}

/** Refund leg — opens at the deal's `timeout`. */
export async function refund(client: FleetClient, args: { escrow: Address; account?: Address }): Promise<Hex> {
  const cd = buildCallData.refund({ escrow: args.escrow });
  await simulate(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
  if (!client.walletClient) throw new Error("refund: client has no walletClient/account");
  return client.walletClient.sendTransaction({
    to: cd.to,
    data: cd.data,
    value: 0n,
    account: client.walletClient.account ?? null,
    chain: client.walletClient.chain ?? null,
  });
}
