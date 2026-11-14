/**
 * client — the viem seam: one place that holds the public client (reads/simulate) and the
 * wallet client (writes). Modules stay pure (buildCallData) and only touch viem here, so a
 * builder can be unit-tested with no RPC at all.
 */
import { createPublicClient, createWalletClient, http, toFunctionSelector, type Abi, type PublicClient, type WalletClient, type Account, type Chain } from "viem";
import { base, optimism, arbitrum, polygon, bsc, gnosis, mantle, scroll, linea, opBNB, unichain } from "viem/chains";
import type { Address, ChainKey, Hex } from "./types.js";
import { NotDeployed, Paused, SdkError } from "./types.js";
import { factoryAdminAbi } from "./abi.js";

/**
 * Every chain the book knows. Not a policy list: `supportedChains()` (addressBook.ts) is DERIVED from
 * the book's `status` fields, because "supported" means "you may wire new business here" and that is
 * exactly what `status: v1-paused` denies (SDK-4). A literal here went stale the moment the v1 line
 * was paused — it still named arbitrum.
 */
const VIEM_CHAINS = { base, optimism, arbitrum, polygon, bsc, gnosis, mantle, scroll, linea, opBNB, unichain } as const;

export function chainFor(key: ChainKey): Chain {
  const c = (VIEM_CHAINS as Record<string, Chain | undefined>)[key];
  if (!c) throw new SdkError(`chain "${key}" not in viem/chains set {${Object.keys(VIEM_CHAINS).join(", ")}}`);
  return c;
}

export interface FleetClient {
  publicClient: PublicClient;
  walletClient?: WalletClient;
}

export interface ClientOpts {
  chain: ChainKey;
  rpcUrl?: string;
  account?: Account;
}

export function createFleetClient(opts: ClientOpts): FleetClient {
  const chain = chainFor(opts.chain);
  const transport = opts.rpcUrl ? http(opts.rpcUrl) : http();
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = opts.account ? createWalletClient({ chain, transport, account: opts.account }) : undefined;
  return { publicClient, ...(walletClient ? { walletClient } : {}) };
}

/**
 * simulate — run an `eth_call` before any send. Returns the decoded result plus the gas
 * estimate; throws with a reason on revert, so a caller never broadcasts a doomed tx.
 */
export async function simulate(
  client: FleetClient,
  args: { account?: `0x${string}`; to: `0x${string}`; data: `0x${string}`; value?: bigint },
): Promise<{ result: `0x${string}`; gas: bigint }> {
  const { publicClient } = client;
  const req = {
    to: args.to,
    data: args.data,
    ...(args.value !== undefined ? { value: args.value } : {}),
    ...(args.account ? { account: args.account } : {}),
  } as const;
  try {
    // call() surfaces the revert reason; estimateGas() gives a budget.
    const [result, gas] = await Promise.all([
      publicClient.call(req),
      publicClient.estimateGas({ ...req, account: args.account }),
    ]);
    return { result: (result.data ?? "0x") as `0x${string}`, gas };
  } catch (e) {
    throw new SdkError(`simulate failed for ${args.to}: ${(e as Error).message}`, e);
  }
}

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
export async function supports(
  client: FleetClient,
  args: { to: Address; abi: Abi; fn: string },
): Promise<boolean> {
  const selector = selectorFor(args.abi, args.fn);
  if (!(await supportsSelector(client, args.to, selector))) return false;
  return !(await isPaused(client, args.to));
}

/** Code + selector only — the pre-SDK-4 answer, with no `paused()` read. */
export async function isDispatched(client: FleetClient, args: { to: Address; abi: Abi; fn: string }): Promise<boolean> {
  return supportsSelector(client, args.to, selectorFor(args.abi, args.fn));
}

export async function supportsSelector(client: FleetClient, to: Address, selector: Hex): Promise<boolean> {
  const code = await getCodeCached(client, to);
  if (code === "0x" || code.length <= 2) return false;
  // selector is 0x + 8 hex; the runtime holds it as a 4-byte constant (PUSH4). Match the bare bytes.
  return code.toLowerCase().includes(selector.slice(2).toLowerCase());
}

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

const PAUSED_SELECTOR: Hex = "0x5c975abb";
const FEE_RECIPIENT_SELECTOR: Hex = "0x46904840";

/**
 * Resolve `fn` against an ABI fragment, or throw a named error.
 *
 * WHY: `toFunctionSelector(undefined)` throws a bare `Cannot read properties of undefined (reading
 * 'type')` from inside abitype — useless when the real bug is "you typed the name wrong / the
 * fragment has a different signature". This also catches the overload case rather than silently
 * pinning whichever member `find` hits first.
 */
function selectorFor(abi: Abi, fn: string): Hex {
  const hits = (abi as readonly { type: string; name?: string }[]).filter((f) => f.type === "function" && f.name === fn);
  if (hits.length === 0) throw new SdkError(`fn "${fn}" not in the supplied abi`);
  if (hits.length > 1) throw new SdkError(`fn "${fn}" is overloaded in the supplied abi — pass one fragment`);
  return toFunctionSelector(hits[0] as never);
}

/**
 * capability — the full verdict for a (address, abi, fn) triple. Throws (SdkError) only when the RPC
 * itself dies (or `fn` is absent from the abi); absence and pause are values, not exceptions, so a
 * caller can branch on them.
 */
export async function capability(client: FleetClient, args: { to: Address; abi: Abi; fn: string }): Promise<Capability> {
  const selector = selectorFor(args.abi, args.fn);
  if (!(await supportsSelector(client, args.to, selector))) {
    return { state: "not-deployed", to: args.to, selector, ok: false };
  }
  if (await isPaused(client, args.to)) {
    return { state: "paused", to: args.to, selector, ok: false };
  }
  return { state: "ready", to: args.to, selector, ok: true };
}

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
export async function readFeeRecipient(client: FleetClient, factory: Address): Promise<Address> {
  if (!(await supportsSelector(client, factory, FEE_RECIPIENT_SELECTOR))) {
    throw new NotDeployed(factory, FEE_RECIPIENT_SELECTOR, "fn feeRecipient not dispatched");
  }
  try {
    return await client.publicClient.readContract({
      address: factory,
      abi: factoryAdminAbi,
      functionName: "feeRecipient",
    });
  } catch (e) {
    throw new SdkError(`feeRecipient() read failed for ${factory} (dead RPC?): ${(e as Error).message}`, e);
  }
}

/** `capability(...)` collapsed to the boolean "may I send now?" (paused reads as false). */
export async function canSend(client: FleetClient, args: { to: Address; abi: Abi; fn: string }): Promise<boolean> {
  return (await capability(client, args)).state === "ready";
}

/**
 * Read `paused()` off a target — cached per client. Returns `false` for a non-factory (no selector) so
 * only factories pay the extra `eth_call`, and one call per address per client covers a whole flow.
 * A dead RPC propagates as SdkError, never as a fabricated `false`.
 */
const _pausedCache = new WeakMap<FleetClient, Map<string, boolean>>();

export async function isPaused(client: FleetClient, to: Address): Promise<boolean> {
  const code = await getCodeCached(client, to);
  if (code.length <= 2 || !code.toLowerCase().includes(PAUSED_SELECTOR.slice(2))) return false;
  let m = _pausedCache.get(client);
  if (!m) {
    m = new Map();
    _pausedCache.set(client, m);
  }
  const key = to.toLowerCase();
  const hit = m.get(key);
  if (hit !== undefined) return hit;
  try {
    const paused = await client.publicClient.readContract({
      address: to,
      abi: factoryAdminAbi,
      functionName: "paused",
    });
    m.set(key, paused);
    return paused;
  } catch (e) {
    throw new SdkError(`paused() read failed for ${to} (dead RPC?): ${(e as Error).message}`, e);
  }
}

/** Cache `eth_getCode` per (chainId,address); a dead RPC is an ERROR, never a silent `0x`. */
const _codeCache = new WeakMap<FleetClient, Map<string, Hex>>();
export async function getCodeCached(client: FleetClient, to: Address): Promise<Hex> {
  let m = _codeCache.get(client);
  if (!m) {
    m = new Map();
    _codeCache.set(client, m);
  }
  const key = to.toLowerCase();
  const hit = m.get(key);
  if (hit !== undefined) return hit;
  try {
    const code = (await client.publicClient.getCode({ address: to })) ?? "0x";
    m.set(key, code as Hex);
    return code as Hex;
  } catch (e) {
    throw new SdkError(`getCode failed for ${to} (dead RPC?): ${(e as Error).message}`, e);
  }
}

/**
 * assertSupports — throw `NotDeployed` when (to, fn) is absent. Deployment only: a paused-but-present
 * target PASSES, so a caller that wants the brake checked wants `assertCanSend`.
 */
export async function assertSupports(client: FleetClient, args: { to: Address; abi: Abi; fn: string }): Promise<void> {
  const selector = selectorFor(args.abi, args.fn);
  if (!(await supportsSelector(client, args.to, selector))) {
    throw new NotDeployed(args.to, selector, `fn ${args.fn} not dispatched`);
  }
}

/**
 * assertCanSend — `assertSupports` plus the brake: throws `NotDeployed` when the target is wrong and
 * `Paused` when it is right but shut. The two are different bugs for the caller (fix the address vs
 * wait/re-route), so they are different exceptions. Same RPC-fault rule as the rest: a dead read
 * propagates rather than passing for either.
 */
export async function assertCanSend(client: FleetClient, args: { to: Address; abi: Abi; fn: string }): Promise<void> {
  const cap = await capability(client, args);
  if (cap.state === "not-deployed") throw new NotDeployed(args.to, cap.selector, `fn ${args.fn} not dispatched`);
  if (cap.state === "paused") throw new Paused(args.to, `fn ${args.fn} refused while paused`);
}
