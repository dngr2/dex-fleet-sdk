/**
 * quote — read a rail's fee + net output for an amount. Pure builder + a `read` that calls it.
 */
import { decodeFunctionResult } from "viem";
import { paymentRailAbi } from "../abi.js";
import * as buildCallData from "../buildCallData.js";
import type { FleetClient } from "../client.js";
import { simulate } from "../client.js";
import { NATIVE, type Address, type Quote } from "../types.js";

export interface QuoteArgs {
  rail: Address;
  token: Address;
  amount: bigint;
  /** Account to `eth_call` from (defaults to the zero address = view context). */
  account?: Address;
}

/** Pure: calldata for `IPaymentRail.quote(token, amount)`. */
export function quoteCallData(args: Pick<QuoteArgs, "rail" | "token" | "amount">) {
  return buildCallData.quote(args);
}

/** Read the live quote via `eth_call` (no send). */
export async function quote(client: FleetClient, args: QuoteArgs): Promise<Quote> {
  const cd = quoteCallData(args);
  const { result } = await simulate(client, {
    to: cd.to,
    data: cd.data,
    ...(args.account ? { account: args.account } : {}),
  });
  const [fee, out] = decodeFunctionResult({ abi: paymentRailAbi, functionName: "quote", data: result }) as [
    bigint,
    bigint,
  ];
  return { fee, out, total: fee + out, token: args.token === NATIVE ? NATIVE : args.token };
}
