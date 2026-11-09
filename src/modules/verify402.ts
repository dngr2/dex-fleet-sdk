/**
 * verify402 — the x402 payment gate. `verify()` is a read the reference server calls before serving
 * a 402'd resource: true iff `paymentId` settled at least `minAmount` of `token` to exactly `to`.
 * Mismatch on id / recipient / token / under-amount => false. This mirrors the rail `Paid` id.
 */
import { decodeFunctionResult } from "viem";
import { x402FacilitatorAbi } from "../abi.js";
import * as buildCallData from "../buildCallData.js";
import { simulate, type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";

export interface Verify402Args {
  facilitator: Address;
  paymentId: Hex;
  to: Address;
  token: Address;
  /** The server passes the SAME amount it advertised in the 402. */
  minAmount: bigint;
}

export function verify402CallData(args: Verify402Args) {
  return buildCallData.verify402(args);
}/** Read the settlement predicate (no send). */
export async function verify402(client: FleetClient, args: Verify402Args): Promise<boolean> {
  const cd = verify402CallData(args);
  const { result } = await simulate(client, { to: cd.to, data: cd.data });
  return decodeFunctionResult({ abi: x402FacilitatorAbi, functionName: "verify", data: result }) as boolean;
}

/** Raw settlement record read: (to, token, amount, at). */
export async function settlement(
  client: FleetClient,
  args: { facilitator: Address; paymentId: Hex },
): Promise<{ to: Address; token: Address; amount: bigint; at: bigint }> {
  const cd = buildCallData.settlementRecord(args);
  const { result } = await simulate(client, { to: cd.to, data: cd.data });
  const [to, token, amount, at] = decodeFunctionResult({
    abi: x402FacilitatorAbi,
    functionName: "settlement",
    data: result,
  }) as [Address, Address, bigint, bigint];
  return { to, token, amount, at };
}
