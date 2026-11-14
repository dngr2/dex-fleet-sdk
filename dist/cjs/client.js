"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainFor = chainFor;
exports.createFleetClient = createFleetClient;
exports.simulate = simulate;
exports.supports = supports;
exports.isDispatched = isDispatched;
exports.supportsSelector = supportsSelector;
exports.capability = capability;
exports.readFeeRecipient = readFeeRecipient;
exports.canSend = canSend;
exports.isPaused = isPaused;
exports.getCodeCached = getCodeCached;
exports.assertSupports = assertSupports;
exports.assertCanSend = assertCanSend;
/**
 * client — the viem seam: one place that holds the public client (reads/simulate) and the
 * wallet client (writes). Modules stay pure (buildCallData) and only touch viem here, so a
 * builder can be unit-tested with no RPC at all.
 */
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const types_js_1 = require("./types.js");
const abi_js_1 = require("./abi.js");
/**
 * Every chain the book knows. Not a policy list: `supportedChains()` (addressBook.ts) is DERIVED from
 * the book's `status` fields, because "supported" means "you may wire new business here" and that is
 * exactly what `status: v1-paused` denies (SDK-4). A literal here went stale the moment the v1 line
 * was paused — it still named arbitrum.
 */
const VIEM_CHAINS = { base: chains_1.base, optimism: chains_1.optimism, arbitrum: chains_1.arbitrum, polygon: chains_1.polygon, bsc: chains_1.bsc, gnosis: chains_1.gnosis, mantle: chains_1.mantle, scroll: chains_1.scroll, linea: chains_1.linea, opBNB: chains_1.opBNB, unichain: chains_1.unichain };
function chainFor(key) {
    const c = VIEM_CHAINS[key];
    if (!c)
        throw new types_js_1.SdkError(`chain "${key}" not in viem/chains set {${Object.keys(VIEM_CHAINS).join(", ")}}`);
    return c;
}
function createFleetClient(opts) {
    const chain = chainFor(opts.chain);
    const transport = opts.rpcUrl ? (0, viem_1.http)(opts.rpcUrl) : (0, viem_1.http)();
    const publicClient = (0, viem_1.createPublicClient)({ chain, transport });
    const walletClient = opts.account ? (0, viem_1.createWalletClient)({ chain, transport, account: opts.account }) : undefined;
    return { publicClient, ...(walletClient ? { walletClient } : {}) };
}
/**
 * simulate — run an `eth_call` before any send. Returns the decoded result plus the gas
 * estimate; throws with a reason on revert, so a caller never broadcasts a doomed tx.
 */
async function simulate(client, args) {
    const { publicClient } = client;
    const req = {
        to: args.to,
        data: args.data,
        ...(args.value !== undefined ? { value: args.value } : {}),
        ...(args.account ? { account: args.account } : {}),
    };
    try {
        // call() surfaces the revert reason; estimateGas() gives a budget.
        const [result, gas] = await Promise.all([
            publicClient.call(req),
            publicClient.estimateGas({ ...req, account: args.account }),
        ]);
        return { result: (result.data ?? "0x"), gas };
    }
    catch (e) {
        throw new types_js_1.SdkError(`simulate failed for ${args.to}: ${e.message}`, e);
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
async function supports(client, args) {
    const selector = selectorFor(args.abi, args.fn);
    if (!(await supportsSelector(client, args.to, selector)))
        return false;
    return !(await isPaused(client, args.to));
}
/** Code + selector only — the pre-SDK-4 answer, with no `paused()` read. */
async function isDispatched(client, args) {
    return supportsSelector(client, args.to, selectorFor(args.abi, args.fn));
}
async function supportsSelector(client, to, selector) {
    const code = await getCodeCached(client, to);
    if (code === "0x" || code.length <= 2)
        return false;
    // selector is 0x + 8 hex; the runtime holds it as a 4-byte constant (PUSH4). Match the bare bytes.
    return code.toLowerCase().includes(selector.slice(2).toLowerCase());
}
const PAUSED_SELECTOR = "0x5c975abb";
const FEE_RECIPIENT_SELECTOR = "0x46904840";
/**
 * Resolve `fn` against an ABI fragment, or throw a named error.
 *
 * WHY: `toFunctionSelector(undefined)` throws a bare `Cannot read properties of undefined (reading
 * 'type')` from inside abitype — useless when the real bug is "you typed the name wrong / the
 * fragment has a different signature". This also catches the overload case rather than silently
 * pinning whichever member `find` hits first.
 */
function selectorFor(abi, fn) {
    const hits = abi.filter((f) => f.type === "function" && f.name === fn);
    if (hits.length === 0)
        throw new types_js_1.SdkError(`fn "${fn}" not in the supplied abi`);
    if (hits.length > 1)
        throw new types_js_1.SdkError(`fn "${fn}" is overloaded in the supplied abi — pass one fragment`);
    return (0, viem_1.toFunctionSelector)(hits[0]);
}
/**
 * capability — the full verdict for a (address, abi, fn) triple. Throws (SdkError) only when the RPC
 * itself dies (or `fn` is absent from the abi); absence and pause are values, not exceptions, so a
 * caller can branch on them.
 */
async function capability(client, args) {
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
async function readFeeRecipient(client, factory) {
    if (!(await supportsSelector(client, factory, FEE_RECIPIENT_SELECTOR))) {
        throw new types_js_1.NotDeployed(factory, FEE_RECIPIENT_SELECTOR, "fn feeRecipient not dispatched");
    }
    try {
        return await client.publicClient.readContract({
            address: factory,
            abi: abi_js_1.factoryAdminAbi,
            functionName: "feeRecipient",
        });
    }
    catch (e) {
        throw new types_js_1.SdkError(`feeRecipient() read failed for ${factory} (dead RPC?): ${e.message}`, e);
    }
}
/** `capability(...)` collapsed to the boolean "may I send now?" (paused reads as false). */
async function canSend(client, args) {
    return (await capability(client, args)).state === "ready";
}
/**
 * Read `paused()` off a target — cached per client. Returns `false` for a non-factory (no selector) so
 * only factories pay the extra `eth_call`, and one call per address per client covers a whole flow.
 * A dead RPC propagates as SdkError, never as a fabricated `false`.
 */
const _pausedCache = new WeakMap();
async function isPaused(client, to) {
    const code = await getCodeCached(client, to);
    if (code.length <= 2 || !code.toLowerCase().includes(PAUSED_SELECTOR.slice(2)))
        return false;
    let m = _pausedCache.get(client);
    if (!m) {
        m = new Map();
        _pausedCache.set(client, m);
    }
    const key = to.toLowerCase();
    const hit = m.get(key);
    if (hit !== undefined)
        return hit;
    try {
        const paused = await client.publicClient.readContract({
            address: to,
            abi: abi_js_1.factoryAdminAbi,
            functionName: "paused",
        });
        m.set(key, paused);
        return paused;
    }
    catch (e) {
        throw new types_js_1.SdkError(`paused() read failed for ${to} (dead RPC?): ${e.message}`, e);
    }
}
/** Cache `eth_getCode` per (chainId,address); a dead RPC is an ERROR, never a silent `0x`. */
const _codeCache = new WeakMap();
async function getCodeCached(client, to) {
    let m = _codeCache.get(client);
    if (!m) {
        m = new Map();
        _codeCache.set(client, m);
    }
    const key = to.toLowerCase();
    const hit = m.get(key);
    if (hit !== undefined)
        return hit;
    try {
        const code = (await client.publicClient.getCode({ address: to })) ?? "0x";
        m.set(key, code);
        return code;
    }
    catch (e) {
        throw new types_js_1.SdkError(`getCode failed for ${to} (dead RPC?): ${e.message}`, e);
    }
}
/**
 * assertSupports — throw `NotDeployed` when (to, fn) is absent. Deployment only: a paused-but-present
 * target PASSES, so a caller that wants the brake checked wants `assertCanSend`.
 */
async function assertSupports(client, args) {
    const selector = selectorFor(args.abi, args.fn);
    if (!(await supportsSelector(client, args.to, selector))) {
        throw new types_js_1.NotDeployed(args.to, selector, `fn ${args.fn} not dispatched`);
    }
}
/**
 * assertCanSend — `assertSupports` plus the brake: throws `NotDeployed` when the target is wrong and
 * `Paused` when it is right but shut. The two are different bugs for the caller (fix the address vs
 * wait/re-route), so they are different exceptions. Same RPC-fault rule as the rest: a dead read
 * propagates rather than passing for either.
 */
async function assertCanSend(client, args) {
    const cap = await capability(client, args);
    if (cap.state === "not-deployed")
        throw new types_js_1.NotDeployed(args.to, cap.selector, `fn ${args.fn} not dispatched`);
    if (cap.state === "paused")
        throw new types_js_1.Paused(args.to, `fn ${args.fn} refused while paused`);
}
