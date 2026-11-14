/**
 * client tests — the capability verdict (SDK-4), driven by a FAKE client so every branch is reachable
 * with no RPC. The states themselves were also proved live (v1 arbitrum: `paused`; a no-code address
 * and an absent selector: `not-deployed`; a dead endpoint: throw) — this file pins the LOGIC.
 */
import { describe, it, expect, vi } from "vitest";
import { capability, canSend, assertCanSend, isPaused, readFeeRecipient, supports, isDispatched } from "../src/client.js";
import { factoryAdminAbi } from "../src/abi.js";
import { NotDeployed, Paused, SdkError } from "../src/types.js";
import type { Address, Hex } from "../src/types.js";

const SEL_FR = "0x46904840" as Hex; // feeRecipient()
const SEL_PAUSED = "0x5c975abb" as Hex; // paused()
const TARGET = "0x3882A049ee99B96Ea68DF317713ed76008b9A075" as Address;
const TREASURY = "0x5c0fc0917260A0656D253f1625053e3E6Dd2Ef3c" as Address;

/** A runtime that dispatches the selectors you name, and answers paused()/feeRecipient() as told. */
function fake(opts: { code?: string; paused?: boolean; throws?: Error; treasury?: Address }) {
  const dispatched = opts.code ?? `0x60806040${SEL_FR.slice(2)}${SEL_PAUSED.slice(2)}`;
  const publicClient = {
    getCode: vi.fn(async () => {
      if (opts.throws) throw opts.throws;
      return dispatched;
    }),
    readContract: vi.fn(async ({ functionName }: { functionName: string }) => {
      if (opts.throws) throw opts.throws;
      if (functionName === "paused") return opts.paused ?? false;
      if (functionName === "feeRecipient") return opts.treasury ?? TREASURY;
      throw new Error("unexpected read");
    }),
  };
  return { publicClient } as never;
}

describe("capability", () => {
  it("ready — code + selector + brake off", async () => {
    const cap = await capability(fake({}), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" });
    expect(cap).toMatchObject({ state: "ready", ok: true, to: TARGET, selector: SEL_FR });
  });

  it("paused — deployed and dispatching, but the brake is on", async () => {
    const cap = await capability(fake({ paused: true }), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" });
    expect(cap.state).toBe("paused");
    expect(cap.ok).toBe(false);
    // the address was FINE — the selector is still reported as present
    expect(cap.selector).toBe(SEL_FR);
  });

  it("not-deployed — no code at all, and never touches paused()", async () => {
    const c = fake({ code: "0x" });
    const cap = await capability(c, { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" });
    expect(cap.state).toBe("not-deployed");
    expect((c as { publicClient: { readContract: unknown } }).publicClient.readContract).not.toHaveBeenCalled();
  });

  it("not-deployed — code present but the selector is absent (paused() IS present)", async () => {
    const cap = await capability(fake({ code: `0x60806040${SEL_PAUSED.slice(2)}` }), {
      to: TARGET,
      abi: factoryAdminAbi,
      fn: "feeRecipient",
    });
    expect(cap.state).toBe("not-deployed");
  });

  it("a dead RPC THROWS — never reads as not-deployed, nor as ready", async () => {
    await expect(capability(fake({ throws: new Error("429") }), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" })).rejects.toBeInstanceOf(SdkError);
  });

  it("a fn that is not in the abi names itself instead of crashing inside abitype", async () => {
    await expect(supports(fake({}), { to: TARGET, abi: factoryAdminAbi, fn: "nope" })).rejects.toThrow(/not in the supplied abi/);
  });

  it("supports() is FALSE for a paused rail — the whole SDK-1 line (SDK-4 marker)", async () => {
    // the selector IS there; the rail is shut. The boolean go/no-go must say no.
    expect(await supports(fake({ paused: true }), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" })).toBe(false);
    // ...and the raw question still says yes, so the two are separable
    expect(await isDispatched(fake({ paused: true }), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" })).toBe(true);
  });

  it("supports() is true only when deployed AND open", async () => {
    expect(await supports(fake({}), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" })).toBe(true);
    expect(await supports(fake({ code: "0x" }), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" })).toBe(false);
  });

  it("canSend is the boolean form", async () => {
    expect(await canSend(fake({}), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" })).toBe(true);
    expect(await canSend(fake({ paused: true }), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" })).toBe(false);
  });
});

describe("assertCanSend", () => {
  it("throws NotDeployed for a wrong address and Paused for a shut one — different classes", async () => {
    await expect(assertCanSend(fake({ code: "0x" }), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" })).rejects.toBeInstanceOf(NotDeployed);
    await expect(assertCanSend(fake({ paused: true }), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" })).rejects.toBeInstanceOf(Paused);
  });

  it("resolves when ready", async () => {
    await expect(assertCanSend(fake({}), { to: TARGET, abi: factoryAdminAbi, fn: "feeRecipient" })).resolves.toBeUndefined();
  });
});

describe("isPaused / readFeeRecipient", () => {
  it("isPaused caches: one readContract for N calls", async () => {
    const c = fake({ paused: true });
    await isPaused(c, TARGET);
    await isPaused(c, TARGET);
    expect((c as { publicClient: { readContract: { mock: { calls: unknown[] } } } }).publicClient.readContract.mock.calls).toHaveLength(1);
  });

  it("isPaused returns false (no extra call) for a target with no paused() selector", async () => {
    const c = fake({ code: "0x60806040" });
    expect(await isPaused(c, TARGET)).toBe(false);
    expect((c as { publicClient: { readContract: unknown } }).publicClient.readContract).not.toHaveBeenCalled();
  });

  it("readFeeRecipient returns the live value, and refuses a target without the getter", async () => {
    expect(await readFeeRecipient(fake({}), TARGET)).toBe(TREASURY);
    await expect(readFeeRecipient(fake({ code: "0x60806040" }), TARGET)).rejects.toBeInstanceOf(NotDeployed);
  });
});
