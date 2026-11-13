"use strict";
/**
 * toll — the SDK's ONE client-side copy of the fleet fee formula.
 *
 * WHY THIS EXISTS (frozen-vs-live, see README): the FROZEN rails expose `quote(token,amount)`, but
 * the LIVE v1 deployments do NOT — `quote()` reverts. The live toll is computed on-chain by
 * `FeeMath.toll(amount, feeBps, minFee)` inside each Forwarder, reading `registry.minFee()` *state*.
 * So until the v2 factories fire, a caller who wants a fee number must (a) read `feeBps()` live and
 * (b) reproduce the formula HERE. This file is the single named home for that reproduction — not
 * prose inlined into examples, so every example imports the same function and cannot drift.
 *
 * SOURCE OF TRUTH: products/shared/src/FeeMath.sol (library `FeeMath`). This mirrors it WEI-exact,
 * including the dust SKIP boundary (`<=`, not `<`) and both invariants. If FeeMath.sol changes,
 * this must change with it — the unit test `toll.test.ts` pins the boundary and the invariants.
 *
 * It is a mirror, NOT a second source of truth *on chain*: the chain's FeeMath still rules; this is
 * only what a caller prices against before the rails deploy a public `quote()`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.YEAR_SECONDS = void 0;
exports.bpsFee = bpsFee;
exports.toll = toll;
exports.quoteLive = quoteLive;
exports.mgmtFee = mgmtFee;
/** Seconds in the accrual year — Solidity's `365 days`; matches FeeMath.YEAR literally. */
exports.YEAR_SECONDS = 31536000n;
/** Raw bps split, floor-divided — FeeMath.bpsFee. `bps` in basis points (25 = 0.25%). */
function bpsFee(amount, bps) {
    return (amount * BigInt(bps)) / 10000n;
}
/**
 * Split a gross `amount` into (fee, out) — mirrors FeeMath.toll EXACTLY.
 *
 *   amount <= minFee  ->  { fee: 0n, out: amount }            (SKIP: forward whole, untolled)
 *   amount  > minFee  ->  { fee: max(bpsFee, minFee), out: amount - fee }
 *
 * The `<=` boundary is deliberate and load-bearing: at `amount == minFee`, CLAMP would hand the
 * recipient exactly 0. SKIP guarantees `out > 0` for every `amount > 0`.
 */
function toll(amount, bps, minFee) {
    if (amount <= minFee)
        return { fee: 0n, out: amount };
    let fee = bpsFee(amount, bps);
    if (fee < minFee)
        fee = minFee;
    return { fee, out: amount - fee };
}
/**
 * Same as `toll` but takes the whole `Quote` shape for a client that already has `feeBps` + `minFee`
 * read live off the rail. `token` passes through so native/ERC-20 callers branch on the sentinel.
 */
function quoteLive(args) {
    const { fee, out } = toll(args.amount, args.feeBps, args.minFee);
    // total == amount by invariant 1 (fee + out == amount) — it is NOT a second quantity, just the
    // gross the payer sources; written as out+fee so it reads as the split's inverse.
    return { fee, out, total: out + fee, token: args.token };
}
/** Annualized management fee pro-rated over `elapsed` seconds — mirrors FeeMath.mgmtFee (capped at tvl). */
function mgmtFee(tvl, annualBps, elapsed) {
    if (tvl === 0n || BigInt(annualBps) === 0n || elapsed === 0n)
        return 0n;
    let fee = (bpsFee(tvl, annualBps) * elapsed) / exports.YEAR_SECONDS;
    if (fee > tvl)
        fee = tvl;
    return fee;
}
