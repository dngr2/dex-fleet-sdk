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
 * supports — "can I send this right now?" for a (address, abi, fn) triple.
 *
 * TWO gates, both cached per client+address, one `eth_getCode` each:
 *   (a) the target holds code (`eth_getCode` != `0x`) and dispatches the function's selector
 *       (PUSH4 scan over the deployed bytecode), and
 *   (b) its `paused()` brake — if the target has one — is OFF (SDK-4).
 *
 * (b) is not decoration. `supports()` proved code+selector and returned TRUE for the whole paused v1
 * line: every v1 registry still dispatches `register`, so a caller that gated on `supports()` was
 * waved onto a factory that reverts `Paused()`. The function being PRESENT is not the same as the
 * rail being OPEN, and the boolean form is used as a go/no-go, so it must answer the go/no-go.
 *
 * The raw half is `supportsSelector` (code+selector only, no pause read) — use it when the question
 * really is "is this member deployed", e.g. checking an ABI against a runtime. `capability()` keeps
 * the three states distinguishable when a caller needs to know WHICH gate failed.
 *
 * NOT a call-simulation: a function can exist, be unpaused, and still revert on args (that is
 * `simulate`'s job). Selector presence via bytecode scan is heuristic (a 4-byte constant can
 * coincide) but a false POSITIVE still gets caught by the following simulate; a false NEGATIVE only
 * happens for a selector split across PUSH boundaries.
 */
export declare function supports(client: FleetClient, args: {
    to: Address;
    abi: Abi;
    fn: string;
}): Promise<boolean>;
/** Code + selector only — the pre-SDK-4 answer, with no `paused()` read. */
export declare function isDispatched(client: FleetClient, args: {
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
 * WHY `paused` is its own state (SDK-4): the selector being present tells you nothing about the brake
 * — the runtime is immutable, the brake is storage. An integrator that only checked selectors built a
 * valid call, simulated it, and ate a `Paused()` revert on broadcast with no prior signal. The state
 * split is what lets a caller tell "wrong address" from "right address, shut". Every factory gates its CREATE path this way (`register`,
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
 * assertSupports — throw `NotDeployed` when (to, fn) is absent. Deployment only: a paused-but-present
 * target PASSES, so a caller that wants the brake checked wants `assertCanSend`.
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