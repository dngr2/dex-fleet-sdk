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
export declare function supports(client: FleetClient, args: {
    to: Address;
    abi: Abi;
    fn: string;
}): Promise<boolean>;
export declare function supportsSelector(client: FleetClient, to: Address, selector: Hex): Promise<boolean>;
export declare function getCodeCached(client: FleetClient, to: Address): Promise<Hex>;
/**
 * assertSupports — throw `NotDeployed` when (to, fn) is absent. Use before a v2 send so the failure
 * names the real cause (wrong generation / wrong chain) instead of an opaque revert.
 */
export declare function assertSupports(client: FleetClient, args: {
    to: Address;
    abi: Abi;
    fn: string;
}): Promise<void>;
//# sourceMappingURL=client.d.ts.map