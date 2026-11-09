/**
 * swap — p3 Router exact-in swap. `previewFee` reads the flat fee on an input amount.
 */
import { decodeFunctionResult } from "viem";
import { swapRouterAbi } from "../abi.js";
import type { Hop } from "../buildCallData.js";
import * as buildCallData from "../buildCallData.js";
import { simulate, type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";

export type { Hop };

export interface SwapArgs {
  router: Address;
  amountIn: bigint;
  amountOutMin: bigint;
  hops: readonly Hop[];
  recipient: Address;
  deadline: bigint;
  account?: Address;
}

export function swapCallData(args: SwapArgs) {
  return buildCallData.swap(args);
}

/** Read the fee the router would take off `amountIn` at the current rate. */
export async function previewFee(client: FleetClient, args: { router: Address; amountIn: bigint }): Promise<bigint> {
  const cd = buildCallData.previewFee(args);
  const { result } = await simulate(client, { to: cd.to, data: cd.data });
  return decodeFunctionResult({ abi: swapRouterAbi, functionName: "previewFee", data: result }) as bigint;
}

export async function swap(client: FleetClient, args: SwapArgs): Promise<Hex> {
  const cd = swapCallData(args);
  await simulate(client, { to: cd.to, data: cd.data, value: cd.value, ...(args.account ? { account: args.account } : {}) });
  if (!client.walletClient) throw new Error("swap: client has no walletClient/account");
  return client.walletClient.sendTransaction({
    to: cd.to,
    data: cd.data,
    value: cd.value,
    account: client.walletClient.account ?? null,
    chain: client.walletClient.chain ?? null,
  });
}
