import { type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";
export declare function executeLapCallData(args: {
    rail: Address;
    mandateId: Hex;
}): import("../types.js").CallData;
/** The mandate ids DUE now, from `fromMandateId` (exclusive), at most `count`. */
export declare function dueLaps(client: FleetClient, args: {
    rail: Address;
    fromMandateId: Hex;
    count: bigint;
}): Promise<readonly Hex[]>;
/** Fire the next due lap; returns the tx hash (a keeper loop calls this in a tick). */
export declare function executeLap(client: FleetClient, args: {
    rail: Address;
    mandateId: Hex;
    account?: Address;
}): Promise<Hex>;
//# sourceMappingURL=executeLap.d.ts.map