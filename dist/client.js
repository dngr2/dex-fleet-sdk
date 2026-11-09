/**
 * client — the viem seam: one place that holds the public client (reads/simulate) and the
 * wallet client (writes). Modules stay pure (buildCallData) and only touch viem here, so a
 * builder can be unit-tested with no RPC at all.
 */
import { createPublicClient, createWalletClient, http } from "viem";
import { base, optimism, arbitrum } from "viem/chains";
import { SdkError } from "./types.js";
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
//# sourceMappingURL=client.js.map