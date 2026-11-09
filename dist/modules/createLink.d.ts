import { type FleetClient } from "../client.js";
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
export declare function createLinkCallData(args: CreateLinkArgs): import("../types.js").CallData;
/** Read the deposit address `request(destination,…)` would mint on the next call (no tx). */
export declare function predictDepositFor(client: FleetClient, args: {
    registry: Address;
    destination: Address;
}): Promise<Address>;
export declare function createLink(client: FleetClient, args: CreateLinkArgs): Promise<Hex>;
/** Flip a request to settled (merchant / payer / owner only). */
export declare function settleLink(client: FleetClient, args: {
    registry: Address;
    id: bigint;
    account?: Address;
}): Promise<Hex>;
//# sourceMappingURL=createLink.d.ts.map