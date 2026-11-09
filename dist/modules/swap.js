/**
 * swap — p3 Router exact-in swap. `previewFee` reads the flat fee on an input amount.
 */
import { decodeFunctionResult } from "viem";
import { swapRouterAbi } from "../abi.js";
import * as buildCallData from "../buildCallData.js";
import { simulate } from "../client.js";
export function swapCallData(args) {
    return buildCallData.swap(args);
}
/** Read the fee the router would take off `amountIn` at the current rate. */
export async function previewFee(client, args) {
    const cd = buildCallData.previewFee(args);
    const { result } = await simulate(client, { to: cd.to, data: cd.data });
    return decodeFunctionResult({ abi: swapRouterAbi, functionName: "previewFee", data: result });
}
export async function swap(client, args) {
    const cd = swapCallData(args);
    await simulate(client, { to: cd.to, data: cd.data, value: cd.value, ...(args.account ? { account: args.account } : {}) });
    if (!client.walletClient)
        throw new Error("swap: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: cd.value,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
//# sourceMappingURL=swap.js.map