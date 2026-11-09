import { type FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";
export interface Verify402Args {
    facilitator: Address;
    paymentId: Hex;
    to: Address;
    token: Address;
    /** The server passes the SAME amount it advertised in the 402. */
    minAmount: bigint;
}
export declare function verify402CallData(args: Verify402Args): import("../types.js").CallData; /** Read the settlement predicate (no send). */
export declare function verify402(client: FleetClient, args: Verify402Args): Promise<boolean>;
/** Raw settlement record read: (to, token, amount, at). */
export declare function settlement(client: FleetClient, args: {
    facilitator: Address;
    paymentId: Hex;
}): Promise<{
    to: Address;
    token: Address;
    amount: bigint;
    at: bigint;
}>;
//# sourceMappingURL=verify402.d.ts.map