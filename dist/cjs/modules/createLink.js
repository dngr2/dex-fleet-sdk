"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLinkCallData = createLinkCallData;
exports.predictDepositFor = predictDepositFor;
exports.createLink = createLink;
exports.settleLink = settleLink;
/**
 * createLink — f1-a payment links. `request()` mints a stock P2 deposit address for a destination;
 * `predictDepositFor()` reads what it WOULD mint (caller-independent salt, so a link is shareable
 * before any tx), and `settle()` flips the request's status bit.
 */
const viem_1 = require("viem");
const abi_js_1 = require("../abi.js");
const buildCallData = require("../buildCallData.js");
const client_js_1 = require("../client.js");
function createLinkCallData(args) {
    return buildCallData.createLink(args);
}
/** Read the deposit address `request(destination,…)` would mint on the next call (no tx). */
async function predictDepositFor(client, args) {
    const cd = buildCallData.predictDepositFor(args);
    const { result } = await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data });
    return (0, viem_1.decodeFunctionResult)({ abi: abi_js_1.requestRegistryAbi, functionName: "predictDepositFor", data: result });
}
async function createLink(client, args) {
    const cd = createLinkCallData(args);
    await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
    if (!client.walletClient)
        throw new Error("createLink: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: 0n,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
/** Flip a request to settled (merchant / payer / owner only). */
async function settleLink(client, args) {
    const cd = buildCallData.settleLink(args);
    await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
    if (!client.walletClient)
        throw new Error("settleLink: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: 0n,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
