import { type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";
/** outcome() codes — mirror IEscrowRail: 0 open, 1 released, 2 refunded. */
export declare const OUTCOME: {
    readonly OPEN: 0;
    readonly RELEASED: 1;
    readonly REFUNDED: 2;
};
export interface ReleaseArgs {
    escrow: Address;
    /** keccak(preimage); the hashlock key for a hashlocked deal (bytes32(0) for arbiter-only). */
    preimage: Hex;
    account?: Address;
}
export declare function releaseCallData(args: Pick<ReleaseArgs, "escrow" | "preimage">): import("../types.js").CallData;
/** Read the terminal outcome of an escrow (0 open, 1 released, 2 refunded). */
export declare function outcome(client: FleetClient, args: {
    escrow: Address;
}): Promise<number>;
export declare function release(client: FleetClient, args: ReleaseArgs): Promise<Hex>;
/** Refund leg — opens at the deal's `timeout`. */
export declare function refund(client: FleetClient, args: {
    escrow: Address;
    account?: Address;
}): Promise<Hex>;
//# sourceMappingURL=release.d.ts.map