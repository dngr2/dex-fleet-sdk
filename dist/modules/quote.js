/**
 * quote — read a rail's fee + net output for an amount. Pure builder + a `read` that calls it.
 */
import { decodeFunctionResult } from "viem";
import { paymentRailAbi } from "../abi.js";
import * as buildCallData from "../buildCallData.js";
import { simulate } from "../client.js";
import { NATIVE } from "../types.js";
/** Pure: calldata for `IPaymentRail.quote(token, amount)`. */
export function quoteCallData(args) {
    return buildCallData.quote(args);
}
/** Read the live quote via `eth_call` (no send). */
export async function quote(client, args) {
    const cd = quoteCallData(args);
    const { result } = await simulate(client, {
        to: cd.to,
        data: cd.data,
        ...(args.account ? { account: args.account } : {}),
    });
    const [fee, out] = decodeFunctionResult({ abi: paymentRailAbi, functionName: "quote", data: result });
    return { fee, out, total: fee + out, token: args.token === NATIVE ? NATIVE : args.token };
}
//# sourceMappingURL=quote.js.map