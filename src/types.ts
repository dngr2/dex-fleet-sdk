/**
 * Shared types for @fleet/sdk.
 *
 * Money is always `bigint` in base units (wei / token decimals) — never `number` — so a
 * 2^53-ish token balance can't silently lose precision. Addresses are `0x${string}` and
 * normalised to EIP-55 by viem's `getAddress` at the `simulate`/`send` boundary.
 */

export type Address = `0x${string}`;
export type Hex = `0x${string}`;

export type ChainKey = "base" | "optimism" | "arbitrum" | "polygon" | "bsc" | "celo" | "avax" | "monad" | "robinhood";

/** Native sentinel used by rails in place of an ERC-20 address. */
export const NATIVE: Address = "0x0000000000000000000000000000000000000000";

/** A single call in a FleetExecutor batch. */
export interface Call {
  target: Address;
  value: bigint;
  data: Hex;
}

/** Everything a surface needs to build calldata: which rail, its ABI fragment, args. */
export interface CallData {
  /** The rail contract the call targets. */
  to: Address;
  /** `0x…` calldata — 4-byte selector + ABI-encoded args. */
  data: Hex;
  /** Native value to attach (0n for ERC-20 rails). */
  value: bigint;
}

export interface Quote {
  /** Rail fee in the input token's base units. */
  fee: bigint;
  /** Amount the recipient receives (amount − fee). */
  out: bigint;
  /** Total the payer must source (for a native pay, `out + fee`). */
  total: bigint;
  /** Token the quote is denominated in (`NATIVE` for the native rail). */
  token: Address;
}

/**
 * An escrow deal — mirrors IEscrowRail.Deal (frozen). `hook` is optional (address(0) => none);
 * `token == NATIVE` selects the payable native path.
 */
export interface EscrowDeal {
  counterparty: Address;
  arbiter: Address;
  token: Address;
  amount: bigint;
  /** keccak256(preimage); zero => arbiter-only (no hashlock). */
  hash: Hex;
  /** unix seconds; refund opens here. */
  timeout: bigint;
  /** seconds after `timeout` during which release still wins; then refund-only. */
  releaseGrace: bigint;
  hook: Address;
}

/** EIP-712 domain + typed-data bundle for a signed mandate. */
export interface SignedMandate {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: Address;
  };
  types: Record<string, { name: string; type: string }[]>;
  primaryType: string;
  message: Record<string, unknown>;
}

export interface FleetExecutorDomain {
  name: "FleetExecutor";
  version: "1";
  chainId: number;
  verifyingContract: Address;
}

/**
 * EIP-712 types for FleetExecutor.execute — mirrors products/fleet-executor/src/FleetExecutor.sol
 * byte-for-byte: the primary `Execute` type leads with `authority` (== address(this), the delegating
 * account), then the `Call[]`, then nonce/deadline; the `Call` struct is appended per the EIP-712
 * encodeType rule. A mismatch here produces a digest the contract rejects (BadSignature).
 */
export const EIP712_FLEET_EXECUTOR = {
  Call: [
    { name: "target", type: "address" },
    { name: "value", type: "uint256" },
    { name: "data", type: "bytes" },
  ],
  Execute: [
    { name: "authority", type: "address" },
    { name: "calls", type: "Call[]" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

/**
 * EIP-712 types for a signed stream mandate (IStreamRail.setMandateFor portal). Frozen shape — the
 * signed portal is exec-side; the field set mirrors the mandate terms the rail binds.
 */
export const EIP712_MANDATE = {
  Mandate: [
    { name: "payer", type: "address" },
    { name: "recipient", type: "address" },
    { name: "token", type: "address" },
    { name: "ticket", type: "uint256" },
    { name: "period", type: "uint64" },
    { name: "laps", type: "uint32" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export class SdkError extends Error {
  override readonly name = "SdkError";
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
  }
}
