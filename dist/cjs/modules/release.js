"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTCOME = void 0;
exports.releaseCallData = releaseCallData;
exports.outcome = outcome;
exports.release = release;
exports.refund = refund;
/**
 * release — settle an escrow child (release/refund) and read its terminal outcome.
 *
 * Note: `release` targets the ESCROW CHILD address (`IStreamRail`/`IEscrowRail` factory produce a
 * per-deal child), not the factory. `outcome()` is the honest discriminator — `settled` is true
 * after EITHER leg (audit M-3), so a reader that needs "the counterparty was PAID" checks `== 1`.
 */
const viem_1 = require("viem");
const abi_js_1 = require("../abi.js");
const buildCallData = require("../buildCallData.js");
const client_js_1 = require("../client.js");
/** outcome() codes — mirror IEscrowRail: 0 open, 1 released, 2 refunded. */
exports.OUTCOME = { OPEN: 0, RELEASED: 1, REFUNDED: 2 };
function releaseCallData(args) {
    return buildCallData.release(args);
}
/** Read the terminal outcome of an escrow (0 open, 1 released, 2 refunded). */
async function outcome(client, args) {
    const cd = buildCallData.outcome(args);
    const { result } = await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data });
    return Number((0, viem_1.decodeFunctionResult)({ abi: abi_js_1.escrowAbi, functionName: "outcome", data: result }));
}
async function release(client, args) {
    const cd = releaseCallData(args);
    await (0, client_js_1.simulate)(client, {
        to: cd.to,
        data: cd.data,
        ...(args.account ? { account: args.account } : {}),
    });
    if (!client.walletClient)
        throw new Error("release: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: 0n,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
/** Refund leg — opens at the deal's `timeout`. */
async function refund(client, args) {
    const cd = buildCallData.refund({ escrow: args.escrow });
    await (0, client_js_1.simulate)(client, { to: cd.to, data: cd.data, ...(args.account ? { account: args.account } : {}) });
    if (!client.walletClient)
        throw new Error("refund: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: 0n,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
