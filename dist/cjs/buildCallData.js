"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNLIMITED = void 0;
exports.pay = pay;
exports.quote = quote;
exports.createEscrow = createEscrow;
exports.createEscrowForPayer = createEscrowForPayer;
exports.release = release;
exports.refund = refund;
exports.outcome = outcome;
exports.sweepExcess = sweepExcess;
exports.createEscrowLive = createEscrowLive;
exports.createEscrowLiveFor = createEscrowLiveFor;
exports.createLink = createLink;
exports.predictDepositFor = predictDepositFor;
exports.settleLink = settleLink;
exports.setMandate = setMandate;
exports.setMandateLive = setMandateLive;
exports.executeLap = executeLap;
exports.revokeMandate = revokeMandate;
exports.dueLaps = dueLaps;
exports.mandatesOf = mandatesOf;
exports.swap = swap;
exports.previewFee = previewFee;
exports.sweep = sweep;
exports.verify402 = verify402;
exports.markPaid = markPaid;
exports.settlementRecord = settlementRecord;
exports.settlementPaid = settlementPaid;
exports.markPaidRegistry = markPaidRegistry;
exports.approve = approve;
exports.approveExact = approveExact;
exports.approveUnlimited = approveUnlimited;
exports.revokeApproval = revokeApproval;
exports.allowance = allowance;
exports.batch = batch;
exports.executeSelf = executeSelf;
exports.asCall = asCall;
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
const viem_1 = require("viem");
const abi_js_1 = require("./abi.js");
function build(abi, fn, a) {
    const data = (0, viem_1.encodeFunctionData)({
        abi,
        functionName: fn,
        args: a.args,
    });
    return { to: a.to, data, value: a.value ?? 0n };
}
// ---------------------------------------------------------------------------- payment rail
/** IPaymentRail.pay(to, token, amount, memo, referrer) — payable when token == NATIVE. */
function pay(a) {
    return build(abi_js_1.paymentRailAbi, "pay", {
        to: a.rail,
        args: [a.to, a.token, a.amount, a.memo, a.referrer],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** IPaymentRail.quote(token, amount) — read call (value 0). */
function quote(a) {
    return build(abi_js_1.paymentRailAbi, "quote", { to: a.rail, args: [a.token, a.amount] });
}
// ---------------------------------------------------------------------------- escrow rail
/** IEscrowRail.createFor(Deal, referrer) — payable when the deal's token is NATIVE. */
function createEscrow(a) {
    return build(abi_js_1.escrowRailAbi, "createFor", {
        to: a.rail,
        args: [toDealTuple(a.deal), a.referrer],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** IEscrowRail.createForPayer(Deal, payer, sig) — escrow for a third-party payer via signature. */
function createEscrowForPayer(a) {
    return build(abi_js_1.escrowRailAbi, "createForPayer", {
        to: a.rail,
        args: [toDealTuple(a.deal), a.payer, a.sig],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** The escrow CHILD's release(preimage) — `to` is the escrow address, not the factory. */
function release(a) {
    return build(abi_js_1.escrowAbi, "release", { to: a.escrow, args: [a.preimage] });
}
/** The escrow CHILD's refund() — opens at `timeout`. */
function refund(a) {
    return build(abi_js_1.escrowAbi, "refund", { to: a.escrow, args: [] });
}
/** The escrow CHILD's outcome() — read call: 0 open, 1 released, 2 refunded. */
function outcome(a) {
    return build(abi_js_1.escrowAbi, "outcome", { to: a.escrow, args: [] });
}
/** Escrow CHILD's sweepExcess() — return post-settlement deposits to the payer. */
function sweepExcess(a) {
    return build(abi_js_1.escrowAbi, "sweepExcess", { to: a.escrow, args: [] });
}
/** The 8-field Deal as a positional tuple, in struct order (all static → flat head). */
function toDealTuple(d) {
    return [d.counterparty, d.arbiter, d.token, d.amount, d.hash, d.timeout, d.releaseGrace, d.hook];
}
/** The 6-field LIVE Deal (no referrer/grace/hook) as a positional tuple. */
function toLiveDealTuple(d) {
    return [d.counterparty, d.arbiter, d.token, d.amount, d.hash, d.timeout];
}
/**
 * LIVE g2b EscrowFactory.create(counterparty, token, amount, hash, timeout) — the published verb
 * (selector 0xa083c5e1, in llms.txt). Use THIS against the live factory: the frozen 8-field
 * `createFor` selector (0xd9b22c47) is ABSENT from the live runtime.
 */
function createEscrowLive(a) {
    return build(abi_js_1.escrowFactoryLiveAbi, "create", {
        to: a.factory,
        args: [a.counterparty, a.token, a.amount, a.hash, a.timeout],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** LIVE g2b EscrowFactory.createFor(6-field Deal) — escrow with a named arbiter, no referrer. */
function createEscrowLiveFor(a) {
    return build(abi_js_1.escrowFactoryLiveAbi, "createFor", {
        to: a.factory,
        args: [toLiveDealTuple(a.deal)],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
// ---------------------------------------------------------------------------- payment links
/** RequestRegistry.request(destination, token, amount, memo) — mints a deposit address. */
function createLink(a) {
    return build(abi_js_1.requestRegistryAbi, "request", {
        to: a.registry,
        args: [a.destination, a.token, a.amount, a.memo],
    });
}
/** RequestRegistry.predictDepositFor(destination) — read the address `request` WOULD mint. */
function predictDepositFor(a) {
    return build(abi_js_1.requestRegistryAbi, "predictDepositFor", { to: a.registry, args: [a.destination] });
}
/** RequestRegistry.settle(id) — flip a request to settled. */
function settleLink(a) {
    return build(abi_js_1.requestRegistryAbi, "settle", { to: a.registry, args: [a.id] });
}
// ---------------------------------------------------------------------------- streams
/** IStreamRail.setMandateFor(payer, recipient, token, ticket, period, laps, referrer, sig). */
function setMandate(a) {
    return build(abi_js_1.streamRailAbi, "setMandateFor", {
        to: a.rail,
        args: [a.payer, a.recipient, a.token, a.ticket, a.period, a.laps, a.referrer, a.sig],
    });
}
/** Live g2a StreamFactory.setMandate(recipient, token, ticket, period, laps, t0) — owner=payer path. */
function setMandateLive(a) {
    return build(abi_js_1.streamFactoryLiveAbi, "setMandate", {
        to: a.factory,
        args: [a.recipient, a.token, a.ticket, a.period, a.laps, a.t0],
    });
}
/** IStreamRail.executeLap(mandateId) — permissionless; anyone may fire the next due lap. */
function executeLap(a) {
    return build(abi_js_1.streamRailAbi, "executeLap", { to: a.rail, args: [a.mandateId] });
}
/** IStreamRail.revokeMandate(mandateId) — payer-only terminal marker. */
function revokeMandate(a) {
    return build(abi_js_1.streamRailAbi, "revokeMandate", { to: a.rail, args: [a.mandateId] });
}
/** IStreamRail.dueLaps(fromMandateId, count) — read call: the ids due now. */
function dueLaps(a) {
    return build(abi_js_1.streamRailAbi, "dueLaps", { to: a.rail, args: [a.fromMandateId, a.count] });
}
/** IStreamRail.mandatesOf(payer) — read call: every mandate id for `payer`. */
function mandatesOf(a) {
    return build(abi_js_1.streamRailAbi, "mandatesOf", { to: a.rail, args: [a.payer] });
}
/** p3 Router.swapExactTokensForTokens(ExactInputParams) — exact-in, min-out, flat fee off input. */
function swap(a) {
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
    return build(abi_js_1.swapRouterAbi, "swapExactTokensForTokens", { to: a.router, args: [p] });
}
/** p3 Router.previewFee(amountIn) — read call: the fee the router would take off `amountIn`. */
function previewFee(a) {
    return build(abi_js_1.swapRouterAbi, "previewFee", { to: a.router, args: [a.amountIn] });
}
/** DustSweeper.sweep(tokens, hops, minOut) — pull full balances via Permit2, one-hop to USDC. */
function sweep(a) {
    const hops = a.hops.map((h) => ({
        venue: h.venue,
        tokenIn: h.tokenIn,
        tokenOut: h.tokenOut,
        feeTier: h.feeTier,
        venueRouter: h.venueRouter,
    }));
    return build(abi_js_1.sweepAbi, "sweep", { to: a.sweeper, args: [a.tokens, hops, a.minOut] });
}
// ---------------------------------------------------------------------------- x402
/** x402Facilitator.verify(paymentId, to, token, minAmount) — read call. */
function verify402(a) {
    return build(abi_js_1.x402FacilitatorAbi, "verify", {
        to: a.facilitator,
        args: [a.paymentId, a.to, a.token, a.minAmount],
    });
}
/** x402Facilitator.markPaid(paymentId, to, token, amount) — writer-gated record. */
function markPaid(a) {
    return build(abi_js_1.x402FacilitatorAbi, "markPaid", {
        to: a.facilitator,
        args: [a.paymentId, a.to, a.token, a.amount],
    });
}
/** x402Facilitator.settlement(paymentId) — read call: (to, token, amount, at). */
function settlementRecord(a) {
    return build(abi_js_1.x402FacilitatorAbi, "settlement", { to: a.facilitator, args: [a.paymentId] });
}
/** SettlementRegistry.paid(paymentId) — read call: (amount, at). */
function settlementPaid(a) {
    return build(abi_js_1.settlementRegistryAbi, "paid", { to: a.registry, args: [a.paymentId] });
}
/**
 * SettlementRegistry.markPaid(paymentId, amount) — writer-gated record. NB the DIFFERENT arity from
 * x402Facilitator.markPaid(…,to,token,amount): 0x39747824 vs 0x7dffcf3b. Building the wrong one
 * against a registry/facilitator address decodes garbage — hence a distinct builder + a pinned test.
 */
function markPaidRegistry(a) {
    return build(abi_js_1.settlementRegistryAbi, "markPaid", { to: a.registry, args: [a.paymentId, a.amount] });
}
// ---------------------------------------------------------------------------- approvals (SDK-3)
/**
 * Max-uint256 — what "unlimited" means to every ERC-20 on earth. Named rather than written inline so
 * an integrator can see the one place the sentinel lives; the site forks each hand-rolled
 * `2n**256n-1n` in a page and drifted.
 */
exports.UNLIMITED = 2n ** 256n - 1n;
/**
 * ERC-20 `approve(spender, amount)` — the general form. Prefer `approveExact` when the amount is
 * known; the difference is not cosmetic. An unlimited allowance is a standing grant that survives
 * the transaction: if the spender is ever re-pointed at a worse contract, the old budget is still
 * spendable. An exact allowance self-expires (the pull consumes it).
 *
 * USDT-style tokens (and the canonical `transferFrom` reverting-on-nonzero-change variants) require
 * the allowance be reset to 0 before it can be changed — `revokeApproval()` then `approve()`, two
 * calls. The fleet's own rails are all standard ERC-20/`SafeERC20`, so one call suffices on them.
 */
function approve(a) {
    return build(abi_js_1.erc20ApprovalAbi, "approve", { to: a.token, args: [a.spender, a.amount] });
}
/** Approve exactly `amount` — the default for a one-shot pull (see the reset caveat on `approve`). */
function approveExact(a) {
    return approve(a);
}
/** Approve `UNLIMITED` (max uint256) — one tx to cover a reel of pulls. */
function approveUnlimited(a) {
    return approve({ token: a.token, spender: a.spender, amount: exports.UNLIMITED });
}
/**
 * Revoke — `approve(spender, 0)`. The head of every "revoke approvals" flow: a `StreamFactory`
 * mandate's allowance half is NOT cleared by `disarmMandate()`, so a mandate the payer no longer
 * wants still leaves the factory able to pull the outstanding laps' worth. Disarm the mandate AND
 * revoke the allowance; this builder is the second half.
 */
function revokeApproval(a) {
    return approve({ token: a.token, spender: a.spender, amount: 0n });
}
/** ERC-20 `allowance(owner, spender)` — read call. Check before spending a tx on a redundant revoke. */
function allowance(a) {
    return build(abi_js_1.erc20ApprovalAbi, "allowance", { to: a.token, args: [a.owner, a.spender] });
}
// ---------------------------------------------------------------------------- batch (FleetExecutor)
/** FleetExecutor.execute(calls, nonce, deadline, sig) — EIP-712 signed batch. */
function batch(a) {
    const calls = a.calls.map((c) => ({ target: c.target, value: c.value, data: c.data }));
    return build(abi_js_1.fleetExecutorAbi, "execute", {
        to: a.executor,
        args: [calls, a.nonce, a.deadline, a.sig],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** FleetExecutor.executeSelf(calls) — self-authorized batch (msg.sender == address(this)). */
function executeSelf(a) {
    const calls = a.calls.map((c) => ({ target: c.target, value: c.value, data: c.data }));
    return build(abi_js_1.fleetExecutorAbi, "executeSelf", {
        to: a.executor,
        args: [calls],
        ...(a.value !== undefined ? { value: a.value } : {}),
    });
}
/** Wrap a CallData as a FleetExecutor batch element. */
function asCall(cd) {
    return { target: cd.to, value: cd.value, data: cd.data };
}
