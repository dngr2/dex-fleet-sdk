/**
 * createEscrow — fund an escrow through IEscrowRail.createFor(deal, referrer).
 */
import * as buildCallData from "../buildCallData.js";
import { simulate } from "../client.js";
export function createEscrowCallData(args) {
    return buildCallData.createEscrow(args);
}
export async function createEscrowDryRun(client, args) {
    const cd = createEscrowCallData(args);
    return simulate(client, {
        to: cd.to,
        data: cd.data,
        value: cd.value,
        ...(args.account ? { account: args.account } : {}),
    });
}
export async function createEscrow(client, args) {
    const cd = createEscrowCallData(args);
    await simulate(client, {
        to: cd.to,
        data: cd.data,
        value: cd.value,
        ...(args.account ? { account: args.account } : {}),
    });
    if (!client.walletClient)
        throw new Error("createEscrow: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: cd.value,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
//# sourceMappingURL=createEscrow.js.map