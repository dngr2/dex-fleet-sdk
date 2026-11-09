/**
 * eip712 — typed-data helpers that produce EXACTLY the digest the FleetExecutor (and the mandate
 * portal) verify. The contract's own `digest()` view is the ground truth; these mirror it so a
 * signer can build the payload offline. A drift shows up as a contract-side BadSignature.
 *
 * FleetExecutor domain: name "FleetExecutor", version "1", verifyingContract == address(this)
 * (the delegating account), chainId == block.chainid. Its Execute type leads with `authority`.
 */
import { hashTypedData } from "viem";
import { EIP712_FLEET_EXECUTOR, EIP712_MANDATE } from "./types.js";
/** The FleetExecutor EIP-712 domain for a given executor/authority + chain. */
export function fleetExecutorDomain(chainId, verifyingContract) {
    return { name: "FleetExecutor", version: "1", chainId, verifyingContract };
}
/** The full Execute typed-data for a batch. `authority` == the delegating account (address(this)). */
export function fleetExecutorTypedData(args) {
    return {
        domain: fleetExecutorDomain(args.chainId, args.executor),
        types: EIP712_FLEET_EXECUTOR,
        primaryType: "Execute",
        message: {
            authority: args.authority,
            calls: args.calls.map((c) => ({ target: c.target, value: c.value, data: c.data })),
            nonce: args.nonce,
            deadline: args.deadline,
        },
    };
}
/** The EIP-712 digest a signer must sign for `execute`. */
export function fleetExecutorDigest(args) {
    return hashTypedData(fleetExecutorTypedData(args));
}
/** Sign a batch with a viem wallet, returning the 65-byte signature for `execute`. */
export async function signFleetBatch(wallet, args) {
    if (!wallet.account)
        throw new Error("signFleetBatch: wallet has no account");
    const td = fleetExecutorTypedData(args);
    return wallet.signTypedData({ account: wallet.account, ...td });
}
/** Mandate typed-data for the signed setMandateFor portal. */
export function mandateTypedData(args) {
    return {
        domain: { name: "FleetStream", version: "1", chainId: args.chainId, verifyingContract: args.rail },
        types: EIP712_MANDATE,
        primaryType: "Mandate",
        message: {
            payer: args.payer,
            recipient: args.recipient,
            token: args.token,
            ticket: args.ticket,
            period: args.period,
            laps: args.laps,
            nonce: args.nonce,
            deadline: args.deadline,
        },
    };
}
export function mandateDigest(args) {
    return hashTypedData(mandateTypedData(args));
}
/** Sign a mandate with a viem wallet, returning the signature setMandateFor expects. */
export async function signMandate(wallet, args) {
    if (!wallet.account)
        throw new Error("signMandate: wallet has no account");
    const td = mandateTypedData(args);
    return wallet.signTypedData({ account: wallet.account, ...td });
}
//# sourceMappingURL=eip712.js.map