/**
 * addressBook — read the fleet's contract addresses from `addresses.json`.
 *
 * The SDK never hard-codes a live address in code: it reads the same JSON the deploy/receipt
 * docs cite, so an address is provably the one from source (GOTCHA #73/#181: verify the
 * address from a file + checksum/length, never retype). `resolve()` checksums via viem and
 * throws on a malformed entry rather than passing a bad address downstream.
 */
import { getAddress, isAddress } from "viem";
import type { Address, ChainKey } from "./types.js";
import { SdkError } from "./types.js";

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
export const SUPPORTED_CHAINS: readonly ChainKey[] = ["base", "optimism", "arbitrum"];

export function parseAddressBook(raw: unknown): AddressBook {
  if (typeof raw !== "object" || raw === null) throw new SdkError("addresses.json: not an object");
  const book: AddressBook = {};
  for (const [chain, rails] of Object.entries(raw as Record<string, unknown>)) {
    if (chain.startsWith("$")) continue;
    if (typeof rails !== "object" || rails === null) throw new SdkError(`addresses.json: chain "${chain}" is not an object`);
    book[chain] = parseRails(rails as Record<string, unknown>, chain);
  }
  return book;
}

/** Parse one chain's rail set. A nested `v2` object is recursed (the Base-only v2 line). */
function parseRails(rails: Record<string, unknown>, chain: string): RailAddresses {
  const out: RailAddresses = {};
  for (const [key, val] of Object.entries(rails)) {
    if (key === "v2" && typeof val === "object" && val !== null) {
      out.v2 = parseRails(val as Record<string, unknown>, `${chain}.v2`);
      continue;
    }
    if (typeof val !== "string") continue;
    // `source` is free text; `native`/`chainId`-adjacent are not keys we keep here. Only a 0x-40hex
    // string is checksummed AND EIP-55-verified; anything else is carried through as-is.
    out[key as keyof RailAddresses] = /^0x[0-9a-fA-F]{40}$/.test(val)
      ? checksum(val, `${chain}.${key}`)
      : (val as Address);
  }
  return out;
}

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
export function checksum(addr: string, where = "address"): Address {
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    throw new SdkError(`${where}: "${addr}" is not a 20-byte hex address (len ${addr.length})`);
  }
  if (!isAddress(addr, { strict: true })) {
    throw new SdkError(`${where}: "${addr}" fails EIP-55 checksum`);
  }
  const hasUpper = /[A-F]/.test(addr.slice(2));
  const hasLower = /[a-f]/.test(addr.slice(2));
  if (hasUpper && hasLower) {
    const canonical = getAddress(addr);
    if (canonical !== addr) {
      throw new SdkError(`${where}: "${addr}" has a CORRUPTED EIP-55 checksum — canonical is ${canonical}`);
    }
    return canonical;
  }
  return getAddress(addr);
}

export interface AddressBookLike {
  readonly book: AddressBook;
  rail(chain: ChainKey, name: keyof RailAddresses): Address;
}

/**
 * Build a reader over a parsed book. Import the JSON with your bundler
 * (`import raw from "../addresses.json"`) and pass it here.
 */
export function addressBook(raw: unknown): AddressBookLike {
  const book = parseAddressBook(raw);
  return {
    book,
    rail(chain, name) {
      const hit = book[chain]?.[name];
      if (!hit) throw new SdkError(`addresses.json: no ${name} on chain "${chain}"`);
      return hit as Address;
    },
  };
}
