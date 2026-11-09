/**
 * executeLap — fire the next DUE lap of a mandate. PERMISSIONLESS: any keeper may call, because the
 * authorization lives in the mandate, not the caller. `dueLaps()`/`mandatesOf()` are the read path.
 */
import { decodeFunctionResult } from "viem";
import { streamRailAbi } from "../abi.js";
import * as buildCallData from "../buildCallData.js";
import { simulate } from "../client.js";
export function executeLapCallData(args) {
    return buildCallData.executeLap(args);
}
/** The mandate ids DUE now, from `fromMandateId` (exclusive), at most `count`. */
export async function dueLaps(client, args) {
    const cd = buildCallData.dueLaps(args);
    const { result } = await simulate(client, { to: cd.to, data: cd.data });
    return decodeFunctionResult({ abi: streamRailAbi, functionName: "dueLaps", data: result });
}
/** Fire the next due lap; returns the tx hash (a keeper loop calls this in a tick). */
export async function executeLap(client, args) {
    const cd = executeLapCallData(args);
    await simulate(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
    if (!client.walletClient)
        throw new Error("executeLap: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: 0n,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
//# sourceMappingURL=executeLap.js.map