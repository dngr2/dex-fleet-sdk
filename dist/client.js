/**
 * client — the viem seam: one place that holds the public client (reads/simulate) and the
 * wallet client (writes). Modules stay pure (buildCallData) and only touch viem here, so a
 * builder can be unit-tested with no RPC at all.
 */
import { createPublicClient, createWalletClient, http, toFunctionSelector } from "viem";
import { base, optimism, arbitrum } from "viem/chains";
import { NotDeployed, SdkError } from "./types.js";
const VIEM_CHAINS = { base, optimism, arbitrum };
export function chainFor(key) {
    const c = VIEM_CHAINS[key];
    if (!c)
        throw new SdkError(`chain "${key}" not in viem/chains set {${Object.keys(VIEM_CHAINS).join(", ")}}`);
    return c;
}
export function createFleetClient(opts) {
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
export async function simulate(client, args) {
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
        throw new SdkError(`simulate failed for ${args.to}: ${e.message}`, e);
    }
}
/**
 * supports — runtime capability check for a (address, abi, fn) triple, cached per client+chain.
 *
 * WHY THIS EXISTS (SDK-1): the v2 builders (`pay`, `quote`, `createFor`, mandate verbs) encode
 * selectors whose TARGET is a v2 address. Pointed at a v1 address, or a chain where the rail was
 * never deployed, the builder still produces valid calldata that REVERTS on-chain — a silent trap
 * for a dev copy-pasting. `supports()` proves, before a send, that
 *   (a) the target holds code (`eth_getCode` != `0x`), and
 *   (b) the runtime dispatches the function's selector (PUSH4 scan over the deployed bytecode).
 * Both are cached: one `eth_getCode` per address per client, so a loop over N selects is 1 RPC.
 *
 * NOT a call-simulation: a function can exist yet revert on args (that is `simulate`'s job). This
 * only separates "wrong address / not deployed" from "would work". Selector presence via bytecode
 * scan is heuristic (a 4-byte constant can coincide) but a false POSITIVE still gets caught by the
 * following simulate; a false NEGATIVE only happens for a selector split across PUSH boundaries.
 */
export async function supports(client, args) {
    const selector = toFunctionSelector(args.abi.find((f) => f.type === "function" && f.name === args.fn));
    return supportsSelector(client, args.to, selector);
}
export async function supportsSelector(client, to, selector) {
    const code = await getCodeCached(client, to);
    if (code === "0x" || code.length <= 2)
        return false;
    // selector is 0x + 8 hex; the runtime holds it as a 4-byte constant (PUSH4). Match the bare bytes.
    return code.toLowerCase().includes(selector.slice(2).toLowerCase());
}
/** Cache `eth_getCode` per (chainId,address); a dead RPC is an ERROR, never a silent `0x`. */
const _codeCache = new WeakMap();
export async function getCodeCached(client, to) {
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
        throw new SdkError(`getCode failed for ${to} (dead RPC?): ${e.message}`, e);
    }
}
/**
 * assertSupports — throw `NotDeployed` when (to, fn) is absent. Use before a v2 send so the failure
 * names the real cause (wrong generation / wrong chain) instead of an opaque revert.
 */
export async function assertSupports(client, args) {
    if (!(await supports(client, args))) {
        const selector = toFunctionSelector(args.abi.find((f) => f.type === "function" && f.name === args.fn));
        throw new NotDeployed(args.to, selector, `fn ${args.fn} not dispatched`);
    }
}
//# sourceMappingURL=client.js.map