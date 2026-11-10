import type { Address, ChainKey } from "./types.js";
export interface RailAddresses {
    paymentRail?: Address;
    escrowRail?: Address;
    streamRail?: Address;
    swapRouter?: Address;
    settlementRegistry?: Address;
    fleetExecutor?: Address;
    requestRegistry?: Address;
    receiptNft?: Address;
    x402Facilitator?: Address;
    fleetPaymaster?: Address;
    tollRegistry?: Address;
    feeRecipient?: Address;
    /** Base-only v2 line (see addresses.json `$note_v2_base_only`): same field names, next generation. */
    v2?: RailAddresses;
    /** Source citation string (not an address). */
    source?: string;
}
export interface AddressBook {
    [chain: string]: RailAddresses;
}
/** The rails live on these chains (a subset of ChainKey); others resolve per-entry. */
export declare const SUPPORTED_CHAINS: readonly ChainKey[];
export declare function parseAddressBook(raw: unknown): AddressBook;
/**
 * Checksum-check an address string; throw (with context) on a bad one.
 *
 * WHY the two extra steps: viem's `getAddress` NORMALISES any-case input (it lowercases then
 * re-checksums), so a mistyped MIXED-case address round-trips silently — `getAddress("0xAbC…")`
 * never throws and the "EIP-55 check" proves nothing. We:
 *   1. require a well-formed 20-byte hex string,
 *   2. run `isAddress(x, { strict: true })` (viem's own strict gate),
 *   3. if the input is MIXED-case, require `getAddress(x) === x` — i.e. the input ALREADY carries a
 *      valid checksum. All-lower / all-upper input is accepted (no checksum to contradict).
 */
export declare function checksum(addr: string, where?: string): Address;
export interface AddressBookLike {
    readonly book: AddressBook;
    rail(chain: ChainKey, name: keyof RailAddresses): Address;
}
/**
 * Build a reader over a parsed book. Import the JSON with your bundler
 * (`import raw from "../addresses.json"`) and pass it here.
 */
export declare function addressBook(raw: unknown): AddressBookLike;
//# sourceMappingURL=addressBook.d.ts.map