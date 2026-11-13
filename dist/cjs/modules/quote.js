"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteCallData = quoteCallData;
exports.quote = quote;
/**
 * quote — read a rail's fee + net output for an amount. Pure builder + a `read` that calls it.
 */
const viem_1 = require("viem");
const abi_js_1 = require("../abi.js");
const buildCallData = require("../buildCallData.js");
const client_js_1 = require("../client.js");
const types_js_1 = require("../types.js");
/** Pure: calldata for `IPaymentRail.quote(token, amount)`. */
function quoteCallData(args) {
    return buildCallData.quote(args);
}
/** Read the live quote via `eth_call` (no send). */
async function quote(client, args) {
    const cd = quoteCallData(args);
    const { result } = await (0, client_js_1.simulate)(client, {
        to: cd.to,
        data: cd.data,
        ...(args.account ? { account: args.account } : {}),
    });
    const [fee, out] = (0, viem_1.decodeFunctionResult)({ abi: abi_js_1.paymentRailAbi, functionName: "quote", data: result });
    return { fee, out, total: fee + out, token: args.token === types_js_1.NATIVE ? types_js_1.NATIVE : args.token };
}
