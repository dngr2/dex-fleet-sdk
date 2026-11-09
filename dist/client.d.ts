/**
 * client — the viem seam: one place that holds the public client (reads/simulate) and the
 * wallet client (writes). Modules stay pure (buildCallData) and only touch viem here, so a
 * builder can be unit-tested with no RPC at all.
 */
import { type PublicClient, type WalletClient, type Account, type Chain } from "viem";
import type { ChainKey } from "./types.js";
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
//# sourceMappingURL=client.d.ts.map