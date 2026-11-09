/**
 * addressBook — read the fleet's contract addresses from `addresses.json`.
 *
 * The SDK never hard-codes a live address in code: it reads the same JSON the deploy/receipt
 * docs cite, so an address is provably the one from source (GOTCHA #73/#181: verify the
 * address from a file + checksum/length, never retype). `resolve()` checksums via viem and
 * throws on a malformed entry rather than passing a bad address downstream.
 */
import { getAddress } from "viem";
import { SdkError } from "./types.js";
/** The rails live on these chains (a subset of ChainKey); others resolve per-entry. */
export const SUPPORTED_CHAINS = ["base", "optimism", "arbitrum"];
export function parseAddressBook(raw) {
    if (typeof raw !== "object" || raw === null)
        throw new SdkError("addresses.json: not an object");
    const book = {};
    for (const [chain, rails] of Object.entries(raw)) {
        if (chain.startsWith("$"))
            continue;
        if (typeof rails !== "object" || rails === null)
            throw new SdkError(`addresses.json: chain "${chain}" is not an object`);
        const out = {};
        for (const [key, val] of Object.entries(rails)) {
            if (typeof val !== "string")
                continue;
            // `source` is a free-text citation; `native`/`chainId`-adjacent are real addresses. Only a
            // 0x-40hex string is checksummed; anything else is carried through as-is.
            out[key] = /^0x[0-9a-fA-F]{40}$/.test(val) ? checksum(val, `${chain}.${key}`) : val;
        }
        book[chain] = out;
    }
    return book;
}
/** Checksum-check an address string; throw (with context) on a bad one. */
export function checksum(addr, where = "address") {
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
        throw new SdkError(`${where}: "${addr}" is not a 20-byte hex address (len ${addr.length})`);
    }
    try {
        return getAddress(addr);
    }
    catch (e) {
        throw new SdkError(`${where}: "${addr}" fails EIP-55 checksum`, e);
    }
}
/**
 * Build a reader over a parsed book. Import the JSON with your bundler
 * (`import raw from "../addresses.json"`) and pass it here.
 */
export function addressBook(raw) {
    const book = parseAddressBook(raw);
    return {
        book,
        rail(chain, name) {
            const hit = book[chain]?.[name];
            if (!hit)
                throw new SdkError(`addresses.json: no ${name} on chain "${chain}"`);
            return hit;
        },
    };
}
//# sourceMappingURL=addressBook.js.map