/**
 * toll — pins the client-side mirror of FeeMath.toll against the Solidity rule.
 * Boundary, invariants, and the deploy-default (minFee=0) equivalence, all wei-exact.
 */
import { describe, expect, it } from "vitest";
import { bpsFee, mgmtFee, toll, quoteLive, YEAR_SECONDS } from "../src/toll.js";

describe("bpsFee", () => {
  it("floors like Solidity integer division", () => {
    expect(bpsFee(10000n, 500)).toBe(500n); // 5% of 10_000
    expect(bpsFee(199n, 500)).toBe(9n); // floors, not rounds
    expect(bpsFee(0n, 500)).toBe(0n);
  });
});

describe("toll — FeeMath.toll mirror", () => {
  it("SKIPs (fee 0, forward whole) when amount <= minFee", () => {
    expect(toll(1000n, 500, 1000n)).toEqual({ fee: 0n, out: 1000n }); // == boundary
    expect(toll(999n, 500, 1000n)).toEqual({ fee: 0n, out: 999n });
    expect(toll(1n, 500, 1000n)).toEqual({ fee: 0n, out: 1n });
    expect(toll(1_000_000n, 500, 0n)).toEqual({ fee: 50000n, out: 950000n }); // minFee 0 => legacy
  });

  it("applies the FLOOR: fee = max(bpsFee, minFee) above the line", () => {
    // tiny ticket above minFee: bpsFee (0) < minFee, so the floor wins
    expect(toll(1001n, 500, 1000n)).toEqual({ fee: 1000n, out: 1n });
    // large ticket: bpsFee dominates
    expect(toll(1_000_000n, 500, 1000n)).toEqual({ fee: 50000n, out: 950000n });
  });

  it("invariants: conservation, floor, and out>0 for every amount>0", () => {
    const bps = 500;
    const minFee = 1000n;
    for (const amount of [1n, 999n, 1000n, 1001n, 5000n, 1_000_000n, 123_456_789n]) {
      const { fee, out } = toll(amount, bps, minFee);
      expect(fee + out).toBe(amount); // conservation
      expect(fee === 0n || fee >= minFee).toBe(true); // never below the floor
      expect(out > 0n).toBe(true); // never deliver 0
    }
  });

  it("minFee==0 is byte-identical to the legacy formula", () => {
    for (const amount of [1n, 199n, 123_456_789n]) {
      const { fee, out } = toll(amount, 500, 0n);
      expect(fee).toBe(bpsFee(amount, 500));
      expect(out).toBe(amount - bpsFee(amount, 500));
    }
  });
});

describe("quoteLive", () => {
  it("returns the full Quote shape with total = out + fee", () => {
    const q = quoteLive({ amount: 1_000_000n, feeBps: 500n, minFee: 0n, token: "0x0" });
    expect(q).toEqual({ fee: 50_000n, out: 950_000n, total: 1_000_000n, token: "0x0" });
  });
});

describe("mgmtFee — FeeMath.mgmtFee mirror", () => {
  it("pro-rates over the year and caps at tvl", () => {
    expect(mgmtFee(0n, 200, 1000n)).toBe(0n);
    expect(mgmtFee(1_000_000n, 0, 1000n)).toBe(0n);
    expect(mgmtFee(1_000_000n, 200, 0n)).toBe(0n);
    // full year at 2% = 20_000
    expect(mgmtFee(1_000_000n, 200, YEAR_SECONDS)).toBe(20_000n);
    // 6 years at 20%/yr = 120% -> capped at tvl
    expect(mgmtFee(1_000_000n, 2000, YEAR_SECONDS * 6n)).toBe(1_000_000n);
  });
});
