import { type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";
export interface ApproveArgs {
    token: Address;
    /** The rail/factory that will pull — NOT the token itself. */
    spender: Address;
    amount: bigint;
    account?: Address;
}
/** Approve exactly `amount` — the default. */
export declare function approveCallData(args: Pick<ApproveArgs, "token" | "spender" | "amount">): import("../types.js").CallData;
export declare function approve(client: FleetClient, args: ApproveArgs): Promise<Hex>;
/** Approve `UNLIMITED` — one tx for a reel of pulls. */
export declare function approveUnlimited(client: FleetClient, args: Omit<ApproveArgs, "amount">): Promise<Hex>;
/** Revoke — `approve(spender, 0)`. */
export declare function revokeCallData(args: {
    token: Address;
    spender: Address;
}): import("../types.js").CallData;
export declare function revoke(client: FleetClient, args: {
    token: Address;
    spender: Address;
    account?: Address;
}): Promise<Hex>;
/** Read the outstanding allowance — check before spending a tx on a redundant revoke. */
export declare function allowance(client: FleetClient, args: {
    token: Address;
    owner: Address;
    spender: Address;
}): Promise<bigint>;
/**
 * Revoke only if there is something to revoke. Returns the tx hash, or `undefined` when the
 * allowance was already 0 — the common case after a completed one-shot deal.
 */
export declare function revokeIfAny(client: FleetClient, args: {
    token: Address;
    owner: Address;
    spender: Address;
    account?: Address;
}): Promise<Hex | undefined>;
//# sourceMappingURL=approvals.d.ts.map