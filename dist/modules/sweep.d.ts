import type { SweepHop } from "../buildCallData.js";
import { type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";
export type { SweepHop };
export interface SweepArgs {
    sweeper: Address;
    tokens: readonly Address[];
    hops: readonly SweepHop[];
    minOut: readonly bigint[];
    account?: Address;
}
export declare function sweepCallData(args: SweepArgs): import("../types.js").CallData;
export declare function sweep(client: FleetClient, args: SweepArgs): Promise<Hex>;
//# sourceMappingURL=sweep.d.ts.map