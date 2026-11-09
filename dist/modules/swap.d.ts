import type { Hop } from "../buildCallData.js";
import { type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";
export type { Hop };
export interface SwapArgs {
    router: Address;
    amountIn: bigint;
    amountOutMin: bigint;
    hops: readonly Hop[];
    recipient: Address;
    deadline: bigint;
    account?: Address;
}
export declare function swapCallData(args: SwapArgs): import("../types.js").CallData;
/** Read the fee the router would take off `amountIn` at the current rate. */
export declare function previewFee(client: FleetClient, args: {
    router: Address;
    amountIn: bigint;
}): Promise<bigint>;
export declare function swap(client: FleetClient, args: SwapArgs): Promise<Hex>;
//# sourceMappingURL=swap.d.ts.map