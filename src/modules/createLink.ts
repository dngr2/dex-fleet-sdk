/**
 * createLink — f1-a payment links. `request()` mints a stock P2 deposit address for a destination;
 * `predictDepositFor()` reads what it WOULD mint (caller-independent salt, so a link is shareable
 * before any tx), and `settle()` flips the request's status bit.
 */
import { decodeFunctionResult } from "viem";
import { requestRegistryAbi } from "../abi.js";
import * as buildCallData from "../buildCallData.js";
import { simulate, type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";

export interface CreateLinkArgs {
  registry: Address;
  destination: Address;
  /** NATIVE (address(0)) for an ETH link, else the ERC-20. */
  token: Address;
  amount: bigint;
  memo: Hex;
  account?: Address;
}

export function createLinkCallData(args: CreateLinkArgs) {
  return buildCallData.createLink(args);
}

/** Read the deposit address `request(destination,…)` would mint on the next call (no tx). */
export async function predictDepositFor(client: FleetClient, args: { registry: Address; destination: Address }): Promise<Address> {
  const cd = buildCallData.predictDepositFor(args);
  const { result } = await simulate(client, { to: cd.to, data: cd.data });
  return decodeFunctionResult({ abi: requestRegistryAbi, functionName: "predictDepositFor", data: result }) as Address;
}

export async function createLink(client: FleetClient, args: CreateLinkArgs): Promise<Hex> {
  const cd = createLinkCallData(args);
  await simulate(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
  if (!client.walletClient) throw new Error("createLink: client has no walletClient/account");
  return client.walletClient.sendTransaction({
    to: cd.to,
    data: cd.data,
    value: 0n,
    account: client.walletClient.account ?? null,
    chain: client.walletClient.chain ?? null,
  });
}

/** Flip a request to settled (merchant / payer / owner only). */
export async function settleLink(client: FleetClient, args: { registry: Address; id: bigint; account?: Address }): Promise<Hex> {
  const cd = buildCallData.settleLink(args);
  await simulate(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
  if (!client.walletClient) throw new Error("settleLink: client has no walletClient/account");
  return client.walletClient.sendTransaction({
    to: cd.to,
    data: cd.data,
    value: 0n,
    account: client.walletClient.account ?? null,
    chain: client.walletClient.chain ?? null,
  });
}
