"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapCallData = swapCallData;
exports.previewFee = previewFee;
exports.swap = swap;
/**
 * swap — p3 Router exact-in swap. `previewFee` reads the flat fee on an input amount.
 */
const viem_1 = require("viem");
const abi_js_1 = require("../abi.js");
const buildCallData = require("../buildCallData.js");
const client_js_1 = require("../client.js");
function swapCallData(args) {
    return buildCallData.swap(args);
}
/** Read the fee the router would take off `amountIn` at the current rate. */
async function previewFee(client, args) {
    const cd = buildCallData.previewFee(args);
    const { result } = await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data });
    return (0, viem_1.decodeFunctionResult)({ abi: abi_js_1.swapRouterAbi, functionName: "previewFee", data: result });
}
async function swap(client, args) {
    const cd = swapCallData(args);
    await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data, value: cd.value, ...(args.account ? { account: args.account } : {}) });
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
