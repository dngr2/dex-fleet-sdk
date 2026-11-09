/**
 * buildCallData — PURE calldata builders. No RPC, no viem client, no network.
 *
 * Every builder returns `{ to, data, value }` and is unit-testable by comparing the 4-byte
 * selector + the ABI-encoded tail. This is the load-bearing seam: modules (quote/pay/…) are thin
 * wrappers that add a client + simulate on top of these, so the wire format is tested without a
 * chain.
 *
 * Shapes mirror the FROZEN rails interfaces + the live product surfaces in ./abi.ts (copied, never
 * retyped — GOTCHA #73). A builder here must encode exactly what the corresponding contract
 * decodes; test/buildCallData.test.ts pins each selector so a drift fails the build, not the chain.
 */
import { encodeFunctionData } from "viem";
import { paymentRailAbi, escrowRailAbi, escrowAbi, streamRailAbi, streamFactoryLiveAbi, requestRegistryAbi, swapRouterAbi, sweepAbi, x402FacilitatorAbi, settlementRegistryAbi, fleetExecutorAbi, } from "./abi.js";
function build(abi, fn, a) {
    const data = encodeFunctionData({
        abi,
        functionName: fn,
        args: a.args,
    });
    return { to: a.to, data, value: a.value ?? 0n };
}
// ---------------------------------------------------------------------------- payment rail
/** IPaymentRail.pay(to, token, amount, memo, referrer) — payable when token == NATIVE. */
export function pay(a) {
    return build(paymentRailAbi, "pay", {
        to: a.rail,
        args: [a.to, a.token, a.amount, a.memo, a.referrer],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** IPaymentRail.quote(token, amount) — read call (value 0). */
export function quote(a) {
    return build(paymentRailAbi, "quote", { to: a.rail, args: [a.token, a.amount] });
}
// ---------------------------------------------------------------------------- escrow rail
/** IEscrowRail.createFor(Deal, referrer) — payable when the deal's token is NATIVE. */
export function createEscrow(a) {
    return build(escrowRailAbi, "createFor", {
        to: a.rail,
        args: [toDealTuple(a.deal), a.referrer],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** IEscrowRail.createForPayer(Deal, payer, sig) — escrow for a third-party payer via signature. */
export function createEscrowForPayer(a) {
    return build(escrowRailAbi, "createForPayer", {
        to: a.rail,
        args: [toDealTuple(a.deal), a.payer, a.sig],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** The escrow CHILD's release(preimage) — `to` is the escrow address, not the factory. */
export function release(a) {
    return build(escrowAbi, "release", { to: a.escrow, args: [a.preimage] });
}
/** The escrow CHILD's refund() — opens at `timeout`. */
export function refund(a) {
    return build(escrowAbi, "refund", { to: a.escrow, args: [] });
}
/** The escrow CHILD's outcome() — read call: 0 open, 1 released, 2 refunded. */
export function outcome(a) {
    return build(escrowAbi, "outcome", { to: a.escrow, args: [] });
}
/** Escrow CHILD's sweepExcess() — return post-settlement deposits to the payer. */
export function sweepExcess(a) {
    return build(escrowAbi, "sweepExcess", { to: a.escrow, args: [] });
}
/** The 8-field Deal as a positional tuple, in struct order (all static → flat head). */
function toDealTuple(d) {
    return [d.counterparty, d.arbiter, d.token, d.amount, d.hash, d.timeout, d.releaseGrace, d.hook];
}
// ---------------------------------------------------------------------------- payment links
/** RequestRegistry.request(destination, token, amount, memo) — mints a deposit address. */
export function createLink(a) {
    return build(requestRegistryAbi, "request", {
        to: a.registry,
        args: [a.destination, a.token, a.amount, a.memo],
    });
}
/** RequestRegistry.predictDepositFor(destination) — read the address `request` WOULD mint. */
export function predictDepositFor(a) {
    return build(requestRegistryAbi, "predictDepositFor", { to: a.registry, args: [a.destination] });
}
/** RequestRegistry.settle(id) — flip a request to settled. */
export function settleLink(a) {
    return build(requestRegistryAbi, "settle", { to: a.registry, args: [a.id] });
}
// ---------------------------------------------------------------------------- streams
/** IStreamRail.setMandateFor(payer, recipient, token, ticket, period, laps, referrer, sig). */
export function setMandate(a) {
    return build(streamRailAbi, "setMandateFor", {
        to: a.rail,
        args: [a.payer, a.recipient, a.token, a.ticket, a.period, a.laps, a.referrer, a.sig],
    });
}
/** Live g2a StreamFactory.setMandate(recipient, token, ticket, period, laps, t0) — owner=payer path. */
export function setMandateLive(a) {
    return build(streamFactoryLiveAbi, "setMandate", {
        to: a.factory,
        args: [a.recipient, a.token, a.ticket, a.period, a.laps, a.t0],
    });
}
/** IStreamRail.executeLap(mandateId) — permissionless; anyone may fire the next due lap. */
export function executeLap(a) {
    return build(streamRailAbi, "executeLap", { to: a.rail, args: [a.mandateId] });
}
/** IStreamRail.revokeMandate(mandateId) — payer-only terminal marker. */
export function revokeMandate(a) {
    return build(streamRailAbi, "revokeMandate", { to: a.rail, args: [a.mandateId] });
}
/** IStreamRail.dueLaps(fromMandateId, count) — read call: the ids due now. */
export function dueLaps(a) {
    return build(streamRailAbi, "dueLaps", { to: a.rail, args: [a.fromMandateId, a.count] });
}
/** IStreamRail.mandatesOf(payer) — read call: every mandate id for `payer`. */
export function mandatesOf(a) {
    return build(streamRailAbi, "mandatesOf", { to: a.rail, args: [a.payer] });
}
/** p3 Router.swapExactTokensForTokens(ExactInputParams) — exact-in, min-out, flat fee off input. */
export function swap(a) {
    const p = {
        amountIn: a.amountIn,
        amountOutMin: a.amountOutMin,
        hops: a.hops.map((h) => ({
            venue: h.venue,
            tokenIn: h.tokenIn,
            tokenOut: h.tokenOut,
            feeTier: h.feeTier,
            stable: h.stable,
            venueRouter: h.venueRouter,
            factory: h.factory,
        })),
        recipient: a.recipient,
        deadline: a.deadline,
    };
    return build(swapRouterAbi, "swapExactTokensForTokens", { to: a.router, args: [p] });
}
/** p3 Router.previewFee(amountIn) — read call: the fee the router would take off `amountIn`. */
export function previewFee(a) {
    return build(swapRouterAbi, "previewFee", { to: a.router, args: [a.amountIn] });
}
/** DustSweeper.sweep(tokens, hops, minOut) — pull full balances via Permit2, one-hop to USDC. */
export function sweep(a) {
    const hops = a.hops.map((h) => ({
        venue: h.venue,
        tokenIn: h.tokenIn,
        tokenOut: h.tokenOut,
        feeTier: h.feeTier,
        venueRouter: h.venueRouter,
    }));
    return build(sweepAbi, "sweep", { to: a.sweeper, args: [a.tokens, hops, a.minOut] });
}
// ---------------------------------------------------------------------------- x402
/** x402Facilitator.verify(paymentId, to, token, minAmount) — read call. */
export function verify402(a) {
    return build(x402FacilitatorAbi, "verify", {
        to: a.facilitator,
        args: [a.paymentId, a.to, a.token, a.minAmount],
    });
}
/** x402Facilitator.markPaid(paymentId, to, token, amount) — writer-gated record. */
export function markPaid(a) {
    return build(x402FacilitatorAbi, "markPaid", {
        to: a.facilitator,
        args: [a.paymentId, a.to, a.token, a.amount],
    });
}
/** x402Facilitator.settlement(paymentId) — read call: (to, token, amount, at). */
export function settlementRecord(a) {
    return build(x402FacilitatorAbi, "settlement", { to: a.facilitator, args: [a.paymentId] });
}
/** SettlementRegistry.paid(paymentId) — read call: (amount, at). */
export function settlementPaid(a) {
    return build(settlementRegistryAbi, "paid", { to: a.registry, args: [a.paymentId] });
}
// ---------------------------------------------------------------------------- batch (FleetExecutor)
/** FleetExecutor.execute(calls, nonce, deadline, sig) — EIP-712 signed batch. */
export function batch(a) {
    const calls = a.calls.map((c) => ({ target: c.target, value: c.value, data: c.data }));
    return build(fleetExecutorAbi, "execute", {
        to: a.executor,
        args: [calls, a.nonce, a.deadline, a.sig],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** FleetExecutor.executeSelf(calls) — self-authorized batch (msg.sender == address(this)). */
export function executeSelf(a) {
    const calls = a.calls.map((c) => ({ target: c.target, value: c.value, data: c.data }));
    return build(fleetExecutorAbi, "executeSelf", {
        to: a.executor,
        args: [calls],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** Wrap a CallData as a FleetExecutor batch element. */
export function asCall(cd) {
    return { target: cd.to, value: cd.value, data: cd.data };
}
//# sourceMappingURL=buildCallData.js.map