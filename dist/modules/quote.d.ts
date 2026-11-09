import type { FleetClient } from "../client.js";
import { type Address, type Quote } from "../types.js";
export interface QuoteArgs {
    rail: Address;
    token: Address;
    amount: bigint;
    /** Account to `eth_call` from (defaults to the zero address = view context). */
    account?: Address;
}
/** Pure: calldata for `IPaymentRail.quote(token, amount)`. */
export declare function quoteCallData(args: Pick<QuoteArgs, "rail" | "token" | "amount">): import("../types.js").CallData;
/** Read the live quote via `eth_call` (no send). */
export declare function quote(client: FleetClient, args: QuoteArgs): Promise<Quote>;
//# sourceMappingURL=quote.d.ts.map