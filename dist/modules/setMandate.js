import { simulate } from "../client.js";
import * as buildCallData from "../buildCallData.js";
export function setMandateCallData(args) {
    return buildCallData.setMandate(args);
}
export async function setMandate(client, args) {
    const cd = setMandateCallData(args);
    await simulate(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
    if (!client.walletClient)
        throw new Error("setMandate: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: 0n,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
export function setMandateLiveCallData(args) {
    return buildCallData.setMandateLive(args);
}
export async function setMandateLive(client, args) {
    const cd = setMandateLiveCallData(args);
    await simulate(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
    if (!client.walletClient)
        throw new Error("setMandateLive: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: 0n,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
//# sourceMappingURL=setMandate.js.map