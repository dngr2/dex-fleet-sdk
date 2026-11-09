import { type FleetClient } from "../client.js";
import type { Address, EscrowDeal, Hex } from "../types.js";
export interface CreateEscrowArgs {
    rail: Address;
    deal: EscrowDeal;
    referrer: Address;
    value?: bigint;
    account?: Address;
}
export declare function createEscrowCallData(args: CreateEscrowArgs): import("../types.js").CallData;
export declare function createEscrowDryRun(client: FleetClient, args: CreateEscrowArgs): Promise<{
    result: `0x${string}`;
    gas: bigint;
}>;
export declare function createEscrow(client: FleetClient, args: CreateEscrowArgs): Promise<Hex>;
//# sourceMappingURL=createEscrow.d.ts.map