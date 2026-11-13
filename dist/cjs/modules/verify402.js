"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify402CallData = verify402CallData;
exports.verify402 = verify402;
exports.settlement = settlement;
/**
 * verify402 — the x402 payment gate. `verify()` is a read the reference server calls before serving
 * a 402'd resource: true iff `paymentId` settled at least `minAmount` of `token` to exactly `to`.
 * Mismatch on id / recipient / token / under-amount => false. This mirrors the rail `Paid` id.
 */
const viem_1 = require("viem");
const abi_js_1 = require("../abi.js");
const buildCallData = require("../buildCallData.js");
const client_js_1 = require("../client.js");
function verify402CallData(args) {
    return buildCallData.verify402(args);
} /** Read the settlement predicate (no send). */
async function verify402(client, args) {
    const cd = verify402CallData(args);
    const { result } = await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data });
    return (0, viem_1.decodeFunctionResult)({ abi: abi_js_1.x402FacilitatorAbi, functionName: "verify", data: result });
}
/** Raw settlement record read: (to, token, amount, at). */
async function settlement(client, args) {
    const cd = buildCallData.settlementRecord(args);
    const { result } = await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data });
    const [to, token, amount, at] = (0, viem_1.decodeFunctionResult)({
        abi: abi_js_1.x402FacilitatorAbi,
        functionName: "settlement",
        data: result,
    });
    return { to, token, amount, at };
}
