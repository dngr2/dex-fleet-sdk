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
/** Seconds in the accrual year — Solidity's `365 days`; matches FeeMath.YEAR literally. */
export declare const YEAR_SECONDS = 31536000n;
/** Raw bps split, floor-divided — FeeMath.bpsFee. `bps` in basis points (25 = 0.25%). */
export declare function bpsFee(amount: bigint, bps: number | bigint): bigint;
/**
 * Split a gross `amount` into (fee, out) — mirrors FeeMath.toll EXACTLY.
 *
 *   amount <= minFee  ->  { fee: 0n, out: amount }            (SKIP: forward whole, untolled)
 *   amount  > minFee  ->  { fee: max(bpsFee, minFee), out: amount - fee }
 *
 * The `<=` boundary is deliberate and load-bearing: at `amount == minFee`, CLAMP would hand the
 * recipient exactly 0. SKIP guarantees `out > 0` for every `amount > 0`.
 */
export declare function toll(amount: bigint, bps: number | bigint, minFee: bigint): {
    fee: bigint;
    out: bigint;
};
/**
 * Same as `toll` but takes the whole `Quote` shape for a client that already has `feeBps` + `minFee`
 * read live off the rail. `token` passes through so native/ERC-20 callers branch on the sentinel.
 */
export declare function quoteLive(args: {
    amount: bigint;
    feeBps: bigint;
    minFee: bigint;
    token: string;
}): {
    fee: bigint;
    out: bigint;
    total: bigint;
    token: string;
};
/** Annualized management fee pro-rated over `elapsed` seconds — mirrors FeeMath.mgmtFee (capped at tvl). */
export declare function mgmtFee(tvl: bigint, annualBps: number | bigint, elapsed: bigint): bigint;
//# sourceMappingURL=toll.d.ts.map