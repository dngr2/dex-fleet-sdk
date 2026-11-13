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
import { encodeFunctionData, type Abi } from "viem";
import {
  paymentRailAbi,
  escrowRailAbi,
  escrowAbi,
  escrowFactoryLiveAbi,
  streamRailAbi,
  streamFactoryLiveAbi,
  requestRegistryAbi,
  swapRouterAbi,
  sweepAbi,
  x402FacilitatorAbi,
  settlementRegistryAbi,
  fleetExecutorAbi,
  erc20ApprovalAbi,
} from "./abi.js";
import type { Address, CallData, Call, EscrowDeal, LiveEscrowDeal, Hex } from "./types.js";

interface BuildArgs {
  to: Address;
  args: readonly unknown[];
  value?: bigint;
}

function build<A extends Abi>(abi: A, fn: string, a: BuildArgs): CallData {
  const data = encodeFunctionData({
    abi,
    functionName: fn,
    args: a.args as readonly unknown[],
  } as Parameters<typeof encodeFunctionData>[0]) as Hex;
  return { to: a.to, data, value: a.value ?? 0n };
}

// ---------------------------------------------------------------------------- payment rail

/** IPaymentRail.pay(to, token, amount, memo, referrer) — payable when token == NATIVE. */
export function pay(a: {
  rail: Address;
  to: Address;
  token: Address;
  amount: bigint;
  memo: Hex;
  referrer: Address;
  value?: bigint;
}): CallData {
  return build(paymentRailAbi, "pay", {
    to: a.rail,
    args: [a.to, a.token, a.amount, a.memo, a.referrer],
    ...(a.value !== undefined ? { value: a.value } : {}),
  });
}

/** IPaymentRail.quote(token, amount) — read call (value 0). */
export function quote(a: { rail: Address; token: Address; amount: bigint }): CallData {
  return build(paymentRailAbi, "quote", { to: a.rail, args: [a.token, a.amount] });
}

// ---------------------------------------------------------------------------- escrow rail

/** IEscrowRail.createFor(Deal, referrer) — payable when the deal's token is NATIVE. */
export function createEscrow(a: { rail: Address; deal: EscrowDeal; referrer: Address; value?: bigint }): CallData {
  return build(escrowRailAbi, "createFor", {
    to: a.rail,
    args: [toDealTuple(a.deal), a.referrer],
    ...(a.value !== undefined ? { value: a.value } : {}),
  });
}

/** IEscrowRail.createForPayer(Deal, payer, sig) — escrow for a third-party payer via signature. */
export function createEscrowForPayer(a: { rail: Address; deal: EscrowDeal; payer: Address; sig: Hex; value?: bigint }): CallData {
  return build(escrowRailAbi, "createForPayer", {
    to: a.rail,
    args: [toDealTuple(a.deal), a.payer, a.sig],
    ...(a.value !== undefined ? { value: a.value } : {}),
  });
}

/** The escrow CHILD's release(preimage) — `to` is the escrow address, not the factory. */
export function release(a: { escrow: Address; preimage: Hex }): CallData {
  return build(escrowAbi, "release", { to: a.escrow, args: [a.preimage] });
}

/** The escrow CHILD's refund() — opens at `timeout`. */
export function refund(a: { escrow: Address }): CallData {
  return build(escrowAbi, "refund", { to: a.escrow, args: [] });
}

/** The escrow CHILD's outcome() — read call: 0 open, 1 released, 2 refunded. */
export function outcome(a: { escrow: Address }): CallData {
  return build(escrowAbi, "outcome", { to: a.escrow, args: [] });
}

/** Escrow CHILD's sweepExcess() — return post-settlement deposits to the payer. */
export function sweepExcess(a: { escrow: Address }): CallData {
  return build(escrowAbi, "sweepExcess", { to: a.escrow, args: [] });
}

/** The 8-field Deal as a positional tuple, in struct order (all static → flat head). */
function toDealTuple(d: EscrowDeal): readonly unknown[] {
  return [d.counterparty, d.arbiter, d.token, d.amount, d.hash, d.timeout, d.releaseGrace, d.hook];
}

/** The 6-field LIVE Deal (no referrer/grace/hook) as a positional tuple. */
function toLiveDealTuple(d: LiveEscrowDeal): readonly unknown[] {
  return [d.counterparty, d.arbiter, d.token, d.amount, d.hash, d.timeout];
}

/**
 * LIVE g2b EscrowFactory.create(counterparty, token, amount, hash, timeout) — the published verb
 * (selector 0xa083c5e1, in llms.txt). Use THIS against the live factory: the frozen 8-field
 * `createFor` selector (0xd9b22c47) is ABSENT from the live runtime.
 */
export function createEscrowLive(a: {
  factory: Address;
  counterparty: Address;
  token: Address;
  amount: bigint;
  /** keccak256(preimage); zero => arbiter-only, no hashlock. */
  hash: Hex;
  /** unix seconds; refund opens here. */
  timeout: bigint;
  value?: bigint;
}): CallData {
  return build(escrowFactoryLiveAbi, "create", {
    to: a.factory,
    args: [a.counterparty, a.token, a.amount, a.hash, a.timeout],
    ...(a.value !== undefined ? { value: a.value } : {}),
  });
}

/** LIVE g2b EscrowFactory.createFor(6-field Deal) — escrow with a named arbiter, no referrer. */
export function createEscrowLiveFor(a: { factory: Address; deal: LiveEscrowDeal; value?: bigint }): CallData {
  return build(escrowFactoryLiveAbi, "createFor", {
    to: a.factory,
    args: [toLiveDealTuple(a.deal)],
    ...(a.value !== undefined ? { value: a.value } : {}),
  });
}

// ---------------------------------------------------------------------------- payment links

/** RequestRegistry.request(destination, token, amount, memo) — mints a deposit address. */
export function createLink(a: { registry: Address; destination: Address; token: Address; amount: bigint; memo: Hex }): CallData {
  return build(requestRegistryAbi, "request", {
    to: a.registry,
    args: [a.destination, a.token, a.amount, a.memo],
  });
}

/** RequestRegistry.predictDepositFor(destination) — read the address `request` WOULD mint. */
export function predictDepositFor(a: { registry: Address; destination: Address }): CallData {
  return build(requestRegistryAbi, "predictDepositFor", { to: a.registry, args: [a.destination] });
}

/** RequestRegistry.settle(id) — flip a request to settled. */
export function settleLink(a: { registry: Address; id: bigint }): CallData {
  return build(requestRegistryAbi, "settle", { to: a.registry, args: [a.id] });
}

// ---------------------------------------------------------------------------- streams

/** IStreamRail.setMandateFor(payer, recipient, token, ticket, period, laps, referrer, sig). */
export function setMandate(a: {
  rail: Address;
  payer: Address;
  recipient: Address;
  token: Address;
  ticket: bigint;
  period: bigint;
  laps: number;
  referrer: Address;
  sig: Hex;
}): CallData {
  return build(streamRailAbi, "setMandateFor", {
    to: a.rail,
    args: [a.payer, a.recipient, a.token, a.ticket, a.period, a.laps, a.referrer, a.sig],
  });
}

/** Live g2a StreamFactory.setMandate(recipient, token, ticket, period, laps, t0) — owner=payer path. */
export function setMandateLive(a: {
  factory: Address;
  recipient: Address;
  token: Address;
  ticket: bigint;
  period: bigint;
  laps: number;
  t0: bigint;
}): CallData {
  return build(streamFactoryLiveAbi, "setMandate", {
    to: a.factory,
    args: [a.recipient, a.token, a.ticket, a.period, a.laps, a.t0],
  });
}

/** IStreamRail.executeLap(mandateId) — permissionless; anyone may fire the next due lap. */
export function executeLap(a: { rail: Address; mandateId: Hex }): CallData {
  return build(streamRailAbi, "executeLap", { to: a.rail, args: [a.mandateId] });
}

/** IStreamRail.revokeMandate(mandateId) — payer-only terminal marker. */
export function revokeMandate(a: { rail: Address; mandateId: Hex }): CallData {
  return build(streamRailAbi, "revokeMandate", { to: a.rail, args: [a.mandateId] });
}

/** IStreamRail.dueLaps(fromMandateId, count) — read call: the ids due now. */
export function dueLaps(a: { rail: Address; fromMandateId: Hex; count: bigint }): CallData {
  return build(streamRailAbi, "dueLaps", { to: a.rail, args: [a.fromMandateId, a.count] });
}

/** IStreamRail.mandatesOf(payer) — read call: every mandate id for `payer`. */
export function mandatesOf(a: { rail: Address; payer: Address }): CallData {
  return build(streamRailAbi, "mandatesOf", { to: a.rail, args: [a.payer] });
}

// ---------------------------------------------------------------------------- swap (p3)

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
export function swap(a: {
  router: Address;
  amountIn: bigint;
  amountOutMin: bigint;
  hops: readonly Hop[];
  recipient: Address;
  deadline: bigint;
}): CallData {
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
export function previewFee(a: { router: Address; amountIn: bigint }): CallData {
  return build(swapRouterAbi, "previewFee", { to: a.router, args: [a.amountIn] });
}

// ---------------------------------------------------------------------------- dust sweep (f1-c)

export interface SweepHop {
  venue: number;
  tokenIn: Address;
  tokenOut: Address;
  feeTier: number;
  venueRouter: Address;
}

/** DustSweeper.sweep(tokens, hops, minOut) — pull full balances via Permit2, one-hop to USDC. */
export function sweep(a: { sweeper: Address; tokens: readonly Address[]; hops: readonly SweepHop[]; minOut: readonly bigint[] }): CallData {
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
export function verify402(a: { facilitator: Address; paymentId: Hex; to: Address; token: Address; minAmount: bigint }): CallData {
  return build(x402FacilitatorAbi, "verify", {
    to: a.facilitator,
    args: [a.paymentId, a.to, a.token, a.minAmount],
  });
}

/** x402Facilitator.markPaid(paymentId, to, token, amount) — writer-gated record. */
export function markPaid(a: { facilitator: Address; paymentId: Hex; to: Address; token: Address; amount: bigint }): CallData {
  return build(x402FacilitatorAbi, "markPaid", {
    to: a.facilitator,
    args: [a.paymentId, a.to, a.token, a.amount],
  });
}

/** x402Facilitator.settlement(paymentId) — read call: (to, token, amount, at). */
export function settlementRecord(a: { facilitator: Address; paymentId: Hex }): CallData {
  return build(x402FacilitatorAbi, "settlement", { to: a.facilitator, args: [a.paymentId] });
}

/** SettlementRegistry.paid(paymentId) — read call: (amount, at). */
export function settlementPaid(a: { registry: Address; paymentId: Hex }): CallData {
  return build(settlementRegistryAbi, "paid", { to: a.registry, args: [a.paymentId] });
}

/**
 * SettlementRegistry.markPaid(paymentId, amount) — writer-gated record. NB the DIFFERENT arity from
 * x402Facilitator.markPaid(…,to,token,amount): 0x39747824 vs 0x7dffcf3b. Building the wrong one
 * against a registry/facilitator address decodes garbage — hence a distinct builder + a pinned test.
 */
export function markPaidRegistry(a: { registry: Address; paymentId: Hex; amount: bigint }): CallData {
  return build(settlementRegistryAbi, "markPaid", { to: a.registry, args: [a.paymentId, a.amount] });
}

// ---------------------------------------------------------------------------- approvals (SDK-3)

/**
 * Max-uint256 — what "unlimited" means to every ERC-20 on earth. Named rather than written inline so
 * an integrator can see the one place the sentinel lives; the site forks each hand-rolled
 * `2n**256n-1n` in a page and drifted.
 */
export const UNLIMITED: bigint = 2n ** 256n - 1n;

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
export function approve(a: { token: Address; spender: Address; amount: bigint }): CallData {
  return build(erc20ApprovalAbi, "approve", { to: a.token, args: [a.spender, a.amount] });
}

/** Approve exactly `amount` — the default for a one-shot pull (see the reset caveat on `approve`). */
export function approveExact(a: { token: Address; spender: Address; amount: bigint }): CallData {
  return approve(a);
}

/** Approve `UNLIMITED` (max uint256) — one tx to cover a reel of pulls. */
export function approveUnlimited(a: { token: Address; spender: Address }): CallData {
  return approve({ token: a.token, spender: a.spender, amount: UNLIMITED });
}

/**
 * Revoke — `approve(spender, 0)`. The head of every "revoke approvals" flow: a `StreamFactory`
 * mandate's allowance half is NOT cleared by `disarmMandate()`, so a mandate the payer no longer
 * wants still leaves the factory able to pull the outstanding laps' worth. Disarm the mandate AND
 * revoke the allowance; this builder is the second half.
 */
export function revokeApproval(a: { token: Address; spender: Address }): CallData {
  return approve({ token: a.token, spender: a.spender, amount: 0n });
}

/** ERC-20 `allowance(owner, spender)` — read call. Check before spending a tx on a redundant revoke. */
export function allowance(a: { token: Address; owner: Address; spender: Address }): CallData {
  return build(erc20ApprovalAbi, "allowance", { to: a.token, args: [a.owner, a.spender] });
}

// ---------------------------------------------------------------------------- batch (FleetExecutor)

/** FleetExecutor.execute(calls, nonce, deadline, sig) — EIP-712 signed batch. */
export function batch(a: { executor: Address; calls: readonly Call[]; nonce: bigint; deadline: bigint; sig: Hex; value?: bigint }): CallData {
  const calls = a.calls.map((c) => ({ target: c.target, value: c.value, data: c.data }));
  return build(fleetExecutorAbi, "execute", {
    to: a.executor,
    args: [calls, a.nonce, a.deadline, a.sig],
    ...(a.value !== undefined ? { value: a.value } : {}),
  });
}

/** FleetExecutor.executeSelf(calls) — self-authorized batch (msg.sender == address(this)). */
export function executeSelf(a: { executor: Address; calls: readonly Call[]; value?: bigint }): CallData {
  const calls = a.calls.map((c) => ({ target: c.target, value: c.value, data: c.data }));
  return build(fleetExecutorAbi, "executeSelf", {
    to: a.executor,
    args: [calls],
    ...(a.value !== undefined ? { value: a.value } : {}),
  });
}

/** Wrap a CallData as a FleetExecutor batch element. */
export function asCall(cd: CallData): Call {
  return { target: cd.to, value: cd.value, data: cd.data };
}
