"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeLapCallData = executeLapCallData;
exports.dueLaps = dueLaps;
exports.executeLap = executeLap;
/**
 * executeLap — fire the next DUE lap of a mandate. PERMISSIONLESS: any keeper may call, because the
 * authorization lives in the mandate, not the caller. `dueLaps()`/`mandatesOf()` are the read path.
 */
const viem_1 = require("viem");
const abi_js_1 = require("../abi.js");
const buildCallData = require("../buildCallData.js");
const client_js_1 = require("../client.js");
function executeLapCallData(args) {
    return buildCallData.executeLap(args);
}
/** The mandate ids DUE now, from `fromMandateId` (exclusive), at most `count`. */
async function dueLaps(client, args) {
    const cd = buildCallData.dueLaps(args);
    const { result } = await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data });
    return (0, viem_1.decodeFunctionResult)({ abi: abi_js_1.streamRailAbi, functionName: "dueLaps", data: result });
}
/** Fire the next due lap; returns the tx hash (a keeper loop calls this in a tick). */
async function executeLap(client, args) {
    const cd = executeLapCallData(args);
    await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
    if (!client.walletClient)
        throw new Error("executeLap: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: 0n,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
