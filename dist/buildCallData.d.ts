import type { Address, CallData, Call, EscrowDeal, LiveEscrowDeal, Hex } from "./types.js";
/** IPaymentRail.pay(to, token, amount, memo, referrer) — payable when token == NATIVE. */
export declare function pay(a: {
    rail: Address;
    to: Address;
    token: Address;
    amount: bigint;
    memo: Hex;
    referrer: Address;
    value?: bigint;
}): CallData;
/** IPaymentRail.quote(token, amount) — read call (value 0). */
export declare function quote(a: {
    rail: Address;
    token: Address;
    amount: bigint;
}): CallData;
/** IEscrowRail.createFor(Deal, referrer) — payable when the deal's token is NATIVE. */
export declare function createEscrow(a: {
    rail: Address;
    deal: EscrowDeal;
    referrer: Address;
    value?: bigint;
}): CallData;
/** IEscrowRail.createForPayer(Deal, payer, sig) — escrow for a third-party payer via signature. */
export declare function createEscrowForPayer(a: {
    rail: Address;
    deal: EscrowDeal;
    payer: Address;
    sig: Hex;
    value?: bigint;
}): CallData;
/** The escrow CHILD's release(preimage) — `to` is the escrow address, not the factory. */
export declare function release(a: {
    escrow: Address;
    preimage: Hex;
}): CallData;
/** The escrow CHILD's refund() — opens at `timeout`. */
export declare function refund(a: {
    escrow: Address;
}): CallData;
/** The escrow CHILD's outcome() — read call: 0 open, 1 released, 2 refunded. */
export declare function outcome(a: {
    escrow: Address;
}): CallData;
/** Escrow CHILD's sweepExcess() — return post-settlement deposits to the payer. */
export declare function sweepExcess(a: {
    escrow: Address;
}): CallData;
/**
 * LIVE g2b EscrowFactory.create(counterparty, token, amount, hash, timeout) — the published verb
 * (selector 0xa083c5e1, in llms.txt). Use THIS against the live factory: the frozen 8-field
 * `createFor` selector (0xd9b22c47) is ABSENT from the live runtime.
 */
export declare function createEscrowLive(a: {
    factory: Address;
    counterparty: Address;
    token: Address;
    amount: bigint;
    /** keccak256(preimage); zero => arbiter-only, no hashlock. */
    hash: Hex;
    /** unix seconds; refund opens here. */
    timeout: bigint;
    value?: bigint;
}): CallData;
/** LIVE g2b EscrowFactory.createFor(6-field Deal) — escrow with a named arbiter, no referrer. */
export declare function createEscrowLiveFor(a: {
    factory: Address;
    deal: LiveEscrowDeal;
    value?: bigint;
}): CallData;
/** RequestRegistry.request(destination, token, amount, memo) — mints a deposit address. */
export declare function createLink(a: {
    registry: Address;
    destination: Address;
    token: Address;
    amount: bigint;
    memo: Hex;
}): CallData;
/** RequestRegistry.predictDepositFor(destination) — read the address `request` WOULD mint. */
export declare function predictDepositFor(a: {
    registry: Address;
    destination: Address;
}): CallData;
/** RequestRegistry.settle(id) — flip a request to settled. */
export declare function settleLink(a: {
    registry: Address;
    id: bigint;
}): CallData;
/** IStreamRail.setMandateFor(payer, recipient, token, ticket, period, laps, referrer, sig). */
export declare function setMandate(a: {
    rail: Address;
    payer: Address;
    recipient: Address;
    token: Address;
    ticket: bigint;
    period: bigint;
    laps: number;
    referrer: Address;
    sig: Hex;
}): CallData;
/** Live g2a StreamFactory.setMandate(recipient, token, ticket, period, laps, t0) — owner=payer path. */
export declare function setMandateLive(a: {
    factory: Address;
    recipient: Address;
    token: Address;
    ticket: bigint;
    period: bigint;
    laps: number;
    t0: bigint;
}): CallData;
/** IStreamRail.executeLap(mandateId) — permissionless; anyone may fire the next due lap. */
export declare function executeLap(a: {
    rail: Address;
    mandateId: Hex;
}): CallData;
/** IStreamRail.revokeMandate(mandateId) — payer-only terminal marker. */
export declare function revokeMandate(a: {
    rail: Address;
    mandateId: Hex;
}): CallData;
/** IStreamRail.dueLaps(fromMandateId, count) — read call: the ids due now. */
export declare function dueLaps(a: {
    rail: Address;
    fromMandateId: Hex;
    count: bigint;
}): CallData;
/** IStreamRail.mandatesOf(payer) — read call: every mandate id for `payer`. */
export declare function mandatesOf(a: {
    rail: Address;
    payer: Address;
}): CallData;
export interface Hop {
    venue: number;
    tokenIn: Address;
    tokenOut: Address;
    feeTier: number;
    stable: boolean;
    venueRouter: Address;
    factory: Address;
}
/** p3 Router.swapExactTokensForTokens(ExactInputParams) — exact-in, min-out, flat fee off input. */
export declare function swap(a: {
    router: Address;
    amountIn: bigint;
    amountOutMin: bigint;
    hops: readonly Hop[];
    recipient: Address;
    deadline: bigint;
}): CallData;
/** p3 Router.previewFee(amountIn) — read call: the fee the router would take off `amountIn`. */
export declare function previewFee(a: {
    router: Address;
    amountIn: bigint;
}): CallData;
export interface SweepHop {
    venue: number;
    tokenIn: Address;
    tokenOut: Address;
    feeTier: number;
    venueRouter: Address;
}
/** DustSweeper.sweep(tokens, hops, minOut) — pull full balances via Permit2, one-hop to USDC. */
export declare function sweep(a: {
    sweeper: Address;
    tokens: readonly Address[];
    hops: readonly SweepHop[];
    minOut: readonly bigint[];
}): CallData;
/** x402Facilitator.verify(paymentId, to, token, minAmount) — read call. */
export declare function verify402(a: {
    facilitator: Address;
    paymentId: Hex;
    to: Address;
    token: Address;
    minAmount: bigint;
}): CallData;
/** x402Facilitator.markPaid(paymentId, to, token, amount) — writer-gated record. */
export declare function markPaid(a: {
    facilitator: Address;
    paymentId: Hex;
    to: Address;
    token: Address;
    amount: bigint;
}): CallData;
/** x402Facilitator.settlement(paymentId) — read call: (to, token, amount, at). */
export declare function settlementRecord(a: {
    facilitator: Address;
    paymentId: Hex;
}): CallData;
/** SettlementRegistry.paid(paymentId) — read call: (amount, at). */
export declare function settlementPaid(a: {
    registry: Address;
    paymentId: Hex;
}): CallData;
/**
 * SettlementRegistry.markPaid(paymentId, amount) — writer-gated record. NB the DIFFERENT arity from
 * x402Facilitator.markPaid(…,to,token,amount): 0x39747824 vs 0x7dffcf3b. Building the wrong one
 * against a registry/facilitator address decodes garbage — hence a distinct builder + a pinned test.
 */
export declare function markPaidRegistry(a: {
    registry: Address;
    paymentId: Hex;
    amount: bigint;
}): CallData;
/** FleetExecutor.execute(calls, nonce, deadline, sig) — EIP-712 signed batch. */
export declare function batch(a: {
    executor: Address;
    calls: readonly Call[];
    nonce: bigint;
    deadline: bigint;
    sig: Hex;
    value?: bigint;
}): CallData;
/** FleetExecutor.executeSelf(calls) — self-authorized batch (msg.sender == address(this)). */
export declare function executeSelf(a: {
    executor: Address;
    calls: readonly Call[];
    value?: bigint;
}): CallData;
/** Wrap a CallData as a FleetExecutor batch element. */
export declare function asCall(cd: CallData): Call;
//# sourceMappingURL=buildCallData.d.ts.map