/**
 * createEscrow — fund an escrow through IEscrowRail.createFor(deal, referrer).
 */
import * as buildCallData from "../buildCallData.js";
import { simulate, type FleetClient } from "../client.js";
import type { Address, EscrowDeal, Hex } from "../types.js";

export interface CreateEscrowArgs {
  rail: Address;
  deal: EscrowDeal;
  referrer: Address;
  value?: bigint;
  account?: Address;
}

export function createEscrowCallData(args: CreateEscrowArgs) {
  return buildCallData.createEscrow(args);
}

export async function createEscrowDryRun(client: FleetClient, args: CreateEscrowArgs) {
  const cd = createEscrowCallData(args);
  return simulate(client, {
    to: cd.to,
    data: cd.data,
    value: cd.value,
    ...(args.account ? { account: args.account } : {}),
  });
}

export async function createEscrow(client: FleetClient, args: CreateEscrowArgs): Promise<Hex> {
  const cd = createEscrowCallData(args);
  await simulate(client, {
    to: cd.to,
    data: cd.data,
    value: cd.value,
    ...(args.account ? { account: args.account } : {}),
  });
  if (!client.walletClient) throw new Error("createEscrow: client has no walletClient/account");
  return client.walletClient.sendTransaction({
    to: cd.to,
    data: cd.data,
    value: cd.value,
    account: client.walletClient.account ?? null,
    chain: client.walletClient.chain ?? null,
  });
}
