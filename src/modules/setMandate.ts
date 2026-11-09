/**
 * setMandate — recurring-mandate rail. Frozen `setMandateFor(payer,…,sig)` (signed portal) plus a
 * `setMandateLive` for the live g2a StreamFactory's owner=payer form.
 */
import type { FleetClient } from "../client.js";
import { simulate } from "../client.js";
import * as buildCallData from "../buildCallData.js";
import type { Address, Hex } from "../types.js";

export interface SetMandateArgs {
  rail: Address;
  payer: Address;
  recipient: Address;
  token: Address;
  ticket: bigint;
  period: bigint;
  laps: number;
  referrer: Address;
  /** EIP-712 approval over the mandate typed-data (see eip712.mandateTypedData). */
  sig: Hex;
  account?: Address;
}

export function setMandateCallData(args: SetMandateArgs) {
  return buildCallData.setMandate(args);
}

export async function setMandate(client: FleetClient, args: SetMandateArgs): Promise<Hex> {
  const cd = setMandateCallData(args);
  await simulate(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
  if (!client.walletClient) throw new Error("setMandate: client has no walletClient/account");
  return client.walletClient.sendTransaction({
    to: cd.to,
    data: cd.data,
    value: 0n,
    account: client.walletClient.account ?? null,
    chain: client.walletClient.chain ?? null,
  });
}

export interface SetMandateLiveArgs {
  factory: Address;
  recipient: Address;
  token: Address;
  ticket: bigint;
  period: bigint;
  laps: number;
  /** unix seconds of the first lap's start. */
  t0: bigint;
  account?: Address;
}

export function setMandateLiveCallData(args: SetMandateLiveArgs) {
  return buildCallData.setMandateLive(args);
}

export async function setMandateLive(client: FleetClient, args: SetMandateLiveArgs): Promise<Hex> {
  const cd = setMandateLiveCallData(args);
  await simulate(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
  if (!client.walletClient) throw new Error("setMandateLive: client has no walletClient/account");
  return client.walletClient.sendTransaction({
    to: cd.to,
    data: cd.data,
    value: 0n,
    account: client.walletClient.account ?? null,
    chain: client.walletClient.chain ?? null,
  });
}
