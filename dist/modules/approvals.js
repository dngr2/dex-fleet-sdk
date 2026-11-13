/**
 * approvals — the ERC-20 allowance half of every pull-based surface (SDK-3).
 *
 * WHY a module, not a one-liner in the README: the builders existed nowhere, so callers hand-rolled
 * `encodeFunctionData` and the site forks drifted into unconditional `2n**256n-1n`. Two rules fall
 * out of how the fleet actually pulls:
 *
 *   1. **Exact by default.** A one-shot pull consumes what it needs; an exact allowance self-expires
 *      with it. `approveUnlimited` is for a reel (streams, repeated settles) where re-approving each
 *      lap would be worse, and it is opt-in rather than the default.
 *   2. **Revoking is two halves.** A `StreamFactory` mandate is (a) the mandate record and (b) the
 *      allowance. `disarmMandate()` clears only the record — the allowance it armed is still there.
 *      `revoke()` is the second half, and `allowance()` is the read that says whether you still need
 *      it, so a revoke of a 0 allowance does not cost gas.
 *
 * The target is always the TOKEN, never the rail: the spender is the rail.
 */
import { decodeFunctionResult } from "viem";
import { erc20ApprovalAbi } from "../abi.js";
import * as buildCallData from "../buildCallData.js";
import { simulate } from "../client.js";
async function send(client, cd, account) {
    await simulate(client, { to: cd.to, data: cd.data, ...(account ? { account } : {}) });
    if (!client.walletClient)
        throw new Error("approvals: client has no walletClient/account");
    return client.walletClient.sendTransaction({
        to: cd.to,
        data: cd.data,
        value: 0n,
        account: client.walletClient.account ?? null,
        chain: client.walletClient.chain ?? null,
    });
}
/** Approve exactly `amount` — the default. */
export function approveCallData(args) {
    return buildCallData.approveExact(args);
}
export async function approve(client, args) {
    return send(client, approveCallData(args), args.account);
}
/** Approve `UNLIMITED` — one tx for a reel of pulls. */
export async function approveUnlimited(client, args) {
    return send(client, buildCallData.approveUnlimited(args), args.account);
}
/** Revoke — `approve(spender, 0)`. */
export function revokeCallData(args) {
    return buildCallData.revokeApproval(args);
}
export async function revoke(client, args) {
    return send(client, revokeCallData(args), args.account);
}
/** Read the outstanding allowance — check before spending a tx on a redundant revoke. */
export async function allowance(client, args) {
    const cd = buildCallData.allowance(args);
    const { result } = await simulate(client, { to: cd.to, data: cd.data, ...(args.owner ? { account: args.owner } : {}) });
    return decodeFunctionResult({ abi: erc20ApprovalAbi, functionName: "allowance", data: result });
}
/**
 * Revoke only if there is something to revoke. Returns the tx hash, or `undefined` when the
 * allowance was already 0 — the common case after a completed one-shot deal.
 */
export async function revokeIfAny(client, args) {
    const left = await allowance(client, args);
    if (left === 0n)
        return undefined;
    return revoke(client, args);
}
//# sourceMappingURL=approvals.js.map