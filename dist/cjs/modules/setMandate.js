"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMandateCallData = setMandateCallData;
exports.setMandate = setMandate;
exports.setMandateLiveCallData = setMandateLiveCallData;
exports.setMandateLive = setMandateLive;
const client_js_1 = require("../client.js");
const buildCallData = require("../buildCallData.js");
function setMandateCallData(args) {
    return buildCallData.setMandate(args);
}
async function setMandate(client, args) {
    const cd = setMandateCallData(args);
    await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
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
function setMandateLiveCallData(args) {
    return buildCallData.setMandateLive(args);
}
async function setMandateLive(client, args) {
    const cd = setMandateLiveCallData(args);
    await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
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
