import { type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";
export interface PayArgs {
    rail: Address;
    to: Address;
    token: Address;
    amount: bigint;
    memo: Hex;
    referrer: Address;
    /** Native value to attach; defaults to `amount` when token is native. */
    value?: bigint;
    account?: Address;
}
export declare function payCallData(args: PayArgs): import("../types.js").CallData;
/** Simulate-only: proves the pay would succeed without broadcasting. */
export declare function payDryRun(client: FleetClient, args: PayArgs): Promise<{
    result: `0x${string}`;
    gas: bigint;
}>;
/** Send (requires the client to hold a walletClient/account). */
export declare function pay(client: FleetClient, args: PayArgs): Promise<Hex>;
//# sourceMappingURL=pay.d.ts.map