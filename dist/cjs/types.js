"use strict";
/**
 * Shared types for @fleet/sdk.
 *
 * Money is always `bigint` in base units (wei / token decimals) — never `number` — so a
 * 2^53-ish token balance can't silently lose precision. Addresses are `0x${string}` and
 * normalised to EIP-55 by viem's `getAddress` at the `simulate`/`send` boundary.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paused = exports.NotDeployed = exports.SdkError = exports.EIP712_MANDATE = exports.EIP712_FLEET_EXECUTOR = exports.NATIVE = void 0;
/** Native sentinel used by rails in place of an ERC-20 address. */
exports.NATIVE = "0x0000000000000000000000000000000000000000";
/**
 * EIP-712 types for FleetExecutor.execute — mirrors products/fleet-executor/src/FleetExecutor.sol
 * byte-for-byte: the primary `Execute` type leads with `authority` (== address(this), the delegating
 * account), then the `Call[]`, then nonce/deadline; the `Call` struct is appended per the EIP-712
 * encodeType rule. A mismatch here produces a digest the contract rejects (BadSignature).
 */
exports.EIP712_FLEET_EXECUTOR = {
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
};
/**
 * EIP-712 types for a signed stream mandate (IStreamRail.setMandateFor portal). Frozen shape — the
 * signed portal is exec-side; the field set mirrors the mandate terms the rail binds.
 */
exports.EIP712_MANDATE = {
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
};
class SdkError extends Error {
    cause;
    name = "SdkError";
    constructor(message, cause) {
        super(message);
        this.cause = cause;
    }
}
exports.SdkError = SdkError;
/**
 * A builder produced calldata for a module/selector the TARGET has no code (or no such selector)
 * for — i.e. a v2-only surface pointed at a v1 address, or a chain where the rail was never
 * deployed. Carries `to` + `selector` so the caller can act without re-parsing the message.
 */
class NotDeployed extends SdkError {
    to;
    selector;
    constructor(to, selector, detail = "") {
        super(`NotDeployed: ${to} has no code / no selector ${selector}${detail ? ` (${detail})` : ""}`);
        this.to = to;
        this.selector = selector;
        this.name = "NotDeployed";
    }
}
exports.NotDeployed = NotDeployed;
/**
 * The target exists and dispatches the selector, but its `paused()` brake is ON (SDK-4). A different
 * failure from `NotDeployed`: the address is right and the calldata is right, so the fix is to wait
 * (or to settle against it anyway — a paused rail still RELEASES, it only refuses new business).
 * Carries `to` so a caller can route around it without re-parsing a message.
 */
class Paused extends SdkError {
    to;
    constructor(to, detail = "") {
        super(`Paused: ${to} is deployed but paused${detail ? ` (${detail})` : ""}`);
        this.to = to;
        this.name = "Paused";
    }
}
exports.Paused = Paused;
