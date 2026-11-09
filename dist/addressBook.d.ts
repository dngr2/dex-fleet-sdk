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
    feeRecipient?: Address;
    /** Source citation string (not an address). */
    source?: string;
}
export interface AddressBook {
    [chain: string]: RailAddresses;
}
/** The rails live on these chains (a subset of ChainKey); others resolve per-entry. */
export declare const SUPPORTED_CHAINS: readonly ChainKey[];
export declare function parseAddressBook(raw: unknown): AddressBook;
/** Checksum-check an address string; throw (with context) on a bad one. */
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