/**
 * sweep — f1-c DustSweeper. Pulls full token balances via Permit2 and one-hops each to USDC,
 * straight to the caller. The user must have approved Permit2 per token first (out of SDK scope).
 */
import * as buildCallData from "../buildCallData.js";
import { simulate } from "../client.js";
export function sweepCallData(args) {
    return buildCallData.sweep(args);
}
export async function sweep(client, args) {
    const cd = sweepCallData(args);
    await simulate(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
    if (!client.walletClient)
        throw new Error("sweep: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: 0n,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
//# sourceMappingURL=sweep.js.map