/**
 * setMandate — recurring-mandate rail. Frozen `setMandateFor(payer,…,sig)` (signed portal) plus a
 * `setMandateLive` for the live g2a StreamFactory's owner=payer form.
 */
import type { FleetClient } from "../client.js";
import type { Address, Hex } from "../types.js";
export interface SetMandateArgs {
    rail: Address;
    payer: Address;
    recipient: Address;
    token: Address;
    ticket: bigint;
    period: bigint;
    laps: number;
    referrer: Address;
    /** EIP-712 approval over the mandate typed-data (see eip712.mandateTypedData). */
    sig: Hex;
    account?: Address;
}
export declare function setMandateCallData(args: SetMandateArgs): import("../types.js").CallData;
export declare function setMandate(client: FleetClient, args: SetMandateArgs): Promise<Hex>;
export interface SetMandateLiveArgs {
    factory: Address;
    recipient: Address;
    token: Address;
    ticket: bigint;
    period: bigint;
    laps: number;
    /** unix seconds of the first lap's start. */
    t0: bigint;
    account?: Address;
}
export declare function setMandateLiveCallData(args: SetMandateLiveArgs): import("../types.js").CallData;
export declare function setMandateLive(client: FleetClient, args: SetMandateLiveArgs): Promise<Hex>;
//# sourceMappingURL=setMandate.d.ts.map