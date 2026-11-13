import type { Address, ChainKey } from "./types.js";
/**
 * Whether a chain block is the current line or the superseded one.
 *
 * `v1-paused` does not mean "callable but slow" — every one of those v1 registries answers
 * `paused()==true`, so its CREATE verbs revert `Paused()`. Settlement against an already-created
 * child is still fine. A builder that wires NEW business at `v1-paused` is the bug this field names.
 */
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
    /** `live` (current line) or `v1-paused` (deployed, brake on — see addresses.json `$note_status`). */
    status?: ChainStatus;
    /**
     * Present only on a hand-built book. The shipped `addresses.json` carries NO `feeRecipient`:
     * it is live state read off each factory (`readFeeRecipient` in ./client.js), never a constant (SDK-2).
     */
    feeRecipient?: Address;
    /** Base-only v2 line (see addresses.json `$note_v2_base_only`): same field names, next generation. */
    v2?: RailAddresses;
    /** Source citation string (not an address). */
    source?: string;
}
/**
 * Whether a chain block is the current line or the superseded one.
 *
 * `v1-paused` does not mean "callable but slow" — every one of those v1 registries answers
 * `paused()==true`, so its CREATE verbs revert `Paused()`. Settlement against an already-created
 * child is still fine. A builder that wires NEW business at `v1-paused` is the bug this field names.
 */
export type ChainStatus = "live" | "v1-paused";
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
    /** The recorded line for a chain ("live" | "v1-paused"), or undefined if the book omits it. */
    status(chain: ChainKey): ChainStatus | undefined;
}
/**
 * Build a reader over a parsed book. Import the JSON with your bundler
 * (`import raw from "../addresses.json"`) and pass it here.
 */
export declare function addressBook(raw: unknown): AddressBookLike;
//# sourceMappingURL=addressBook.d.ts.map