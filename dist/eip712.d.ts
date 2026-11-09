/**
 * eip712 — typed-data helpers that produce EXACTLY the digest the FleetExecutor (and the mandate
 * portal) verify. The contract's own `digest()` view is the ground truth; these mirror it so a
 * signer can build the payload offline. A drift shows up as a contract-side BadSignature.
 *
 * FleetExecutor domain: name "FleetExecutor", version "1", verifyingContract == address(this)
 * (the delegating account), chainId == block.chainid. Its Execute type leads with `authority`.
 */
import { type TypedDataDefinition } from "viem";
import type { WalletClient } from "viem";
import type { Address, Call, Hex } from "./types.js";
export interface FleetBatchTypedDataArgs {
    chainId: number;
    executor: Address;
    authority: Address;
    calls: readonly Call[];
    nonce: bigint;
    deadline: bigint;
}
export interface MandateTypedDataArgs {
    chainId: number;
    rail: Address;
    payer: Address;
    recipient: Address;
    token: Address;
    ticket: bigint;
    period: bigint;
    laps: number;
    nonce: bigint;
    deadline: bigint;
}
/** The FleetExecutor EIP-712 domain for a given executor/authority + chain. */
export declare function fleetExecutorDomain(chainId: number, verifyingContract: Address): {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: `0x${string}`;
};
/** The full Execute typed-data for a batch. `authority` == the delegating account (address(this)). */
export declare function fleetExecutorTypedData(args: FleetBatchTypedDataArgs): TypedDataDefinition;
/** The EIP-712 digest a signer must sign for `execute`. */
export declare function fleetExecutorDigest(args: FleetBatchTypedDataArgs): Hex;
/** Sign a batch with a viem wallet, returning the 65-byte signature for `execute`. */
export declare function signFleetBatch(wallet: WalletClient, args: FleetBatchTypedDataArgs): Promise<Hex>;
/** Mandate typed-data for the signed setMandateFor portal. */
export declare function mandateTypedData(args: MandateTypedDataArgs): TypedDataDefinition;
export declare function mandateDigest(args: MandateTypedDataArgs): Hex;
/** Sign a mandate with a viem wallet, returning the signature setMandateFor expects. */
export declare function signMandate(wallet: WalletClient, args: MandateTypedDataArgs): Promise<Hex>;
//# sourceMappingURL=eip712.d.ts.map