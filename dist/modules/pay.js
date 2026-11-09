/**
 * pay — build + (optionally) send `IPaymentRail.pay`. Simulates before any send.
 */
import * as buildCallData from "../buildCallData.js";
import { simulate } from "../client.js";
export function payCallData(args) {
    return buildCallData.pay(args);
}
/** Simulate-only: proves the pay would succeed without broadcasting. */
export async function payDryRun(client, args) {
    const cd = payCallData(args);
    return simulate(client, {
        to: cd.to,
        data: cd.data,
        value: cd.value,
        ...(args.account ? { account: args.account } : {}),
    });
}
/** Send (requires the client to hold a walletClient/account). */
export async function pay(client, args) {
    const cd = payCallData(args);
    await simulate(client, {
        to: cd.to,
        data: cd.data,
        value: cd.value,
        ...(args.account ? { account: args.account } : {}),
    });
    if (!client.walletClient)
        throw new Error("pay: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: cd.value,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
//# sourceMappingURL=pay.js.map