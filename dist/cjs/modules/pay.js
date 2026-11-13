"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payCallData = payCallData;
exports.payDryRun = payDryRun;
exports.pay = pay;
/**
 * pay — build + (optionally) send `IPaymentRail.pay`. Simulates before any send.
 */
const buildCallData = require("../buildCallData.js");
const client_js_1 = require("../client.js");
function payCallData(args) {
    return buildCallData.pay(args);
}
/** Simulate-only: proves the pay would succeed without broadcasting. */
async function payDryRun(client, args) {
    const cd = payCallData(args);
    return (0, client_js_1.simulate)(client, {
        to: cd.to,
        data: cd.data,
        value: cd.value,
        ...(args.account ? { account: args.account } : {}),
    });
}
/** Send (requires the client to hold a walletClient/account). */
async function pay(client, args) {
    const cd = payCallData(args);
    await (0, client_js_1.simulate)(client, {
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
