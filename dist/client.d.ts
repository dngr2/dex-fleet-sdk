/**
 * client — the viem seam: one place that holds the public client (reads/simulate) and the
 * wallet client (writes). Modules stay pure (buildCallData) and only touch viem here, so a
 * builder can be unit-tested with no RPC at all.
 */
import { type Abi, type PublicClient, type WalletClient, type Account, type Chain } from "viem";
import type { Address, ChainKey, Hex } from "./types.js";
export declare function chainFor(key: ChainKey): Chain;
export interface FleetClient {
    publicClient: PublicClient;
    walletClient?: WalletClient;
}
export interface ClientOpts {
    chain: ChainKey;
    rpcUrl?: string;
    account?: Account;
}
export declare function createFleetClient(opts: ClientOpts): FleetClient;
/**
 * simulate — run an `eth_call` before any send. Returns the decoded result plus the gas
 * estimate; throws with a reason on revert, so a caller never broadcasts a doomed tx.
 */
export declare function simulate(client: FleetClient, args: {
    account?: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
}): Promise<{
    result: `0x${string}`;
    gas: bigint;
}>;
/**
 * supports — runtime capability check for a (address, abi, fn) triple, cached per client+chain.
 *
 * WHY THIS EXISTS: the v2 builders (`pay`, `quote`, `createFor`, mandate verbs) encode
 * selectors whose TARGET is a v2 address. Pointed at a v1 address, or a chain where the rail was
 * never deployed, the builder still produces valid calldata that REVERTS on-chain — a silent trap
 * for a dev copy-pasting. `supports()` proves, before a send, that
 *   (a) the target holds code (`eth_getCode` != `0x`), and
 *   (b) the runtime dispatches the function's selector (PUSH4 scan over the deployed bytecode).
 * Both are cached: one `eth_getCode` per address per client, so a loop over N selects is 1 RPC.
 *
 * This answers "is the FUNCTION there", nothing more. A selector can be present and the factory
 * still shut to new business — `capability()` / `canSend()` add the `paused()` read (SDK-4). Use
 * those for a go/no-go; `supports()` is the half that costs one cached getCode.
 *
 * NOT a call-simulation: a function can exist yet revert on args (that is `simulate`'s job). This
 * only separates "wrong address / not deployed" from "would work". Selector presence via bytecode
 * scan is heuristic (a 4-byte constant can coincide) but a false POSITIVE still gets caught by the
 * following simulate; a false NEGATIVE only happens for a selector split across PUSH boundaries.
 */
export declare function supports(client: FleetClient, args: {
    to: Address;
    abi: Abi;
    fn: string;
}): Promise<boolean>;
export declare function supportsSelector(client: FleetClient, to: Address, selector: Hex): Promise<boolean>;
/**
 * The capability verdict — three returnable states, only one of which is "go" — plus a THROW for the
 * fourth (`rpc-dead`), because an unreachable RPC is not an answer about the target at all (#138/#147:
 * a 403/429/timeout must never read as "absent", nor as `paused: false`).
 *
 *   "ready"          code present, selector dispatched, brake OFF
 *   "paused"         code present, selector dispatched, `paused()` == true
 *   "not-deployed"   no code, or code without the selector (wrong generation / wrong chain)
 *   (throw)          the read itself failed — neither absence nor pause
 *
 * WHY `paused` is its own state (SDK-4): `supports()` alone answers "is the FUNCTION there", which a
 * paused factory still satisfies — its runtime is immutable, the brake is storage. An integrator that
 * only checked selectors would build a valid call, simulate it, and eat a `Paused()` revert on
 * broadcast with no prior signal. Every factory gates its CREATE path this way (`register`,
 * `createFor`, `setMandate`'s spill); settlement verbs are NOT gated, so `paused` is a warning about
 * new business, not about an in-flight deal.
 *
 * `paused()` is only READ when the target actually dispatches it — a rail without the getter (the
 * frozen wave, any non-factory) is judged on code+selector alone and never makes the extra call.
 */
export type CapabilityState = "ready" | "paused" | "not-deployed";
export interface Capability {
    state: CapabilityState;
    to: Address;
    /** The selector that was proved (or found absent). */
    selector: Hex;
    /** True only for `state === "ready"`. Convenience so `if (await canSend(...))` reads plainly. */
    ok: boolean;
}
/**
 * capability — the full verdict for a (address, abi, fn) triple. Throws (SdkError) only when the RPC
 * itself dies (or `fn` is absent from the abi); absence and pause are values, not exceptions, so a
 * caller can branch on them.
 */
export declare function capability(client: FleetClient, args: {
    to: Address;
    abi: Abi;
    fn: string;
}): Promise<Capability>;
/**
 * Read the treasury off a factory — `factory.feeRecipient()`. This is the replacement for any copied
 * `feeRecipient` constant (SDK-2). The live vaults/escrows pay THIS value at settlement, and the new
 * line moves it behind a 48h staged timelock, so a fixtures copy is stale the moment an owner stages
 * a re-point — with no compile error and no test failure to tell you.
 *
 * Two-RPC note for a one-off check: this reads whichever transport the client was built with. A
 * failover transport is the honest way to use it for a verdict; `getCodeCached` + `paused()` share
 * the same rule (a dead read is an error, never a zero-address answer).
 */
export declare function readFeeRecipient(client: FleetClient, factory: Address): Promise<Address>;
/** `capability(...)` collapsed to the boolean "may I send now?" (paused reads as false). */
export declare function canSend(client: FleetClient, args: {
    to: Address;
    abi: Abi;
    fn: string;
}): Promise<boolean>;
export declare function isPaused(client: FleetClient, to: Address): Promise<boolean>;
export declare function getCodeCached(client: FleetClient, to: Address): Promise<Hex>;
/**
 * assertSupports — throw `NotDeployed` when (to, fn) is absent. Use before a v2 send so the failure
 * names the real cause (wrong generation / wrong chain) instead of an opaque revert.
 *
 * Code/selector only. For a factory CREATE the pause matters as much as the address: use
 * `assertCanSend` when you are about to make something new.
 */
export declare function assertSupports(client: FleetClient, args: {
    to: Address;
    abi: Abi;
    fn: string;
}): Promise<void>;
/**
 * assertCanSend — `assertSupports` plus the brake: throws `NotDeployed` when the target is wrong and
 * `Paused` when it is right but shut. The two are different bugs for the caller (fix the address vs
 * wait/re-route), so they are different exceptions. Same RPC-fault rule as the rest: a dead read
 * propagates rather than passing for either.
 */
export declare function assertCanSend(client: FleetClient, args: {
    to: Address;
    abi: Abi;
    fn: string;
}): Promise<void>;
//# sourceMappingURL=client.d.ts.map