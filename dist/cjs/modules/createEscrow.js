"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEscrowCallData = createEscrowCallData;
exports.createEscrowDryRun = createEscrowDryRun;
exports.createEscrow = createEscrow;
/**
 * createEscrow — fund an escrow through IEscrowRail.createFor(deal, referrer).
 */
const buildCallData = require("../buildCallData.js");
const client_js_1 = require("../client.js");
function createEscrowCallData(args) {
    return buildCallData.createEscrow(args);
}
async function createEscrowDryRun(client, args) {
    const cd = createEscrowCallData(args);
    return (0, client_js_1.simulate)(client, {
        to: cd.to,
        data: cd.data,
        value: cd.value,
        ...(args.account ? { account: args.account } : {}),
    });
}
async function createEscrow(client, args) {
    const cd = createEscrowCallData(args);
    await (0, client_js_1.simulate)(client, {
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
