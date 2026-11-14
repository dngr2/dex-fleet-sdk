/**
 * buildCallData tests — pin the WIRE FORMAT with no chain.
 *
 * Every builder's 4-byte selector is asserted against a value `cast sig` produced independently, so
 * a signature drift fails HERE, not on a mainnet send. A second assertion checks the encoded tail
 * parses back to the inputs. Selectors were derived with `cast sig "<canonical sig>"` (foundry 1.8.6)
 * and are the load-bearing fact — the tail checks catch arg-order/retype slips.
 */
import { describe, it, expect } from "vitest";
import { decodeAbiParameters, toFunctionSelector, getAddress } from "viem";
import * as b from "../src/buildCallData.js";
import { paymentRailAbi, escrowAbi } from "../src/abi.js";
import { NATIVE, type Address, type EscrowDeal, type Hex } from "../src/types.js";

const RAIL = getAddress("0x417c41d406c61E09958032Cd77338fc1F1ac7D45");
const ME = getAddress("0x27339Dd87d6A22414b79Dc7966526906bfBe92C2");
const ZERO = NATIVE;
const ZERO32 = "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex;
const MEMO = "0x00000000000000000000000000000000000000000000000000000000000000ab" as Hex;
const PREIMAGE = "0x1111111111111111111111111111111111111111111111111111111111111111" as Hex;

const sel = (cd: { data: Hex }) => cd.data.slice(0, 10) as Hex;

describe("selectors (pinned via cast sig)", () => {
  it("pay → 0x68abdc82", () => {
    expect(sel(b.pay({ rail: RAIL, to: ME, token: NATIVE, amount: 1n, memo: MEMO, referrer: ZERO }))).toBe("0x68abdc82");
  });
  it("quote → 0x8f79306e", () => {
    expect(sel(b.quote({ rail: RAIL, token: NATIVE, amount: 1n }))).toBe("0x8f79306e");
  });
  it("createFor (8-field Deal) → 0xd9b22c47", () => {
    const deal: EscrowDeal = { counterparty: ME, arbiter: ZERO, token: NATIVE, amount: 1n, hash: ZERO32, timeout: 600n, releaseGrace: 0n, hook: ZERO };
    expect(sel(b.createEscrow({ rail: RAIL, deal, referrer: ZERO }))).toBe("0xd9b22c47");
  });
  it("createForPayer → 0xc715cbc8", () => {
    const deal: EscrowDeal = { counterparty: ME, arbiter: ZERO, token: NATIVE, amount: 1n, hash: ZERO32, timeout: 600n, releaseGrace: 0n, hook: ZERO };
    expect(sel(b.createEscrowForPayer({ rail: RAIL, deal, payer: ME, sig: "0x" }))).toBe("0xc715cbc8");
  });
  it("escrow.release → 0x67d42a8b", () => {
    expect(sel(b.release({ escrow: RAIL, preimage: PREIMAGE }))).toBe("0x67d42a8b");
  });
  it("escrow.refund → 0x590e1ae3", () => {
    expect(sel(b.refund({ escrow: RAIL }))).toBe("0x590e1ae3");
  });
  it("escrow.outcome → 0x27793f87", () => {
    expect(sel(b.outcome({ escrow: RAIL }))).toBe("0x27793f87");
  });
  it("escrow.sweepExcess → 0x975918d8", () => {
    expect(sel(b.sweepExcess({ escrow: RAIL }))).toBe("0x975918d8");
  });
  it("setMandateFor → 0x1370269f", () => {
    expect(
      sel(b.setMandate({ rail: RAIL, payer: ME, recipient: ME, token: NATIVE, ticket: 1n, period: 60n, laps: 2, referrer: ZERO, sig: "0x" })),
    ).toBe("0x1370269f");
  });
  it("executeLap → 0x8f25e28d", () => {
    expect(sel(b.executeLap({ rail: RAIL, mandateId: PREIMAGE }))).toBe("0x8f25e28d");
  });
  it("dueLaps → 0x9a5acba8", () => {
    expect(sel(b.dueLaps({ rail: RAIL, fromMandateId: ZERO32, count: 10n }))).toBe("0x9a5acba8");
  });
  it("swap (router) → 0xd3bd0b52 (matches live p3 selector)", () => {
    const cd = b.swap({ router: RAIL, amountIn: 1n, amountOutMin: 0n, hops: [{ venue: 0, tokenIn: NATIVE, tokenOut: ME, feeTier: 500, stable: false, venueRouter: ME, factory: ME }], recipient: ME, deadline: 1n });
    expect(sel(cd)).toBe("0xd3bd0b52");
  });
  it("previewFee → 0x35e856f2", () => {
    expect(sel(b.previewFee({ router: RAIL, amountIn: 1n }))).toBe("0x35e856f2");
  });
  it("sweep (duster) → 0xe7ea3ccb", () => {
    const cd = b.sweep({ sweeper: RAIL, tokens: [ME], hops: [{ venue: 0, tokenIn: ME, tokenOut: ME, feeTier: 500, venueRouter: ME }], minOut: [0n] });
    expect(sel(cd)).toBe("0xe7ea3ccb");
  });
  it("verify402 → 0x796e926d", () => {
    expect(sel(b.verify402({ facilitator: RAIL, paymentId: PREIMAGE, to: ME, token: NATIVE, minAmount: 1n }))).toBe("0x796e926d");
  });
  it("createLink (request) → 0xdc0edd60 (matches payme SEL.request)", () => {
    expect(sel(b.createLink({ registry: RAIL, destination: ME, token: NATIVE, amount: 1n, memo: MEMO }))).toBe("0xdc0edd60");
  });
  it("predictDepositFor → 0xd6d52f00 (matches payme SEL.predict)", () => {
    expect(sel(b.predictDepositFor({ registry: RAIL, destination: ME }))).toBe("0xd6d52f00");
  });

  // --- approvals (SDK-3): ERC-20 selectors, independent of any rail ---------------------------
  it("approve → 0x095ea7b3", () => {
    expect(sel(b.approve({ token: RAIL, spender: ME, amount: 7n }))).toBe("0x095ea7b3");
  });
  it("approveExact is the same wire call as approve, and approval goes to the TOKEN", () => {
    const exact = b.approveExact({ token: RAIL, spender: ME, amount: 7n });
    expect(exact).toEqual(b.approve({ token: RAIL, spender: ME, amount: 7n }));
    expect(exact.to).toBe(RAIL); // `to` is the token; `spender` is in the args
  });
  it("approveUnlimited encodes max uint256, not a literal", () => {
    const cd = b.approveUnlimited({ token: RAIL, spender: ME });
    expect(sel(cd)).toBe("0x095ea7b3");
    const [spender, amount] = decodeAbiParameters([{ type: "address" }, { type: "uint256" }], ("0x" + cd.data.slice(10)) as Hex);
    expect(spender).toBe(ME);
    expect(amount).toBe(2n ** 256n - 1n);
    expect(b.UNLIMITED).toBe(2n ** 256n - 1n);
  });
  it("revokeApproval encodes amount 0 — the reset half of a USDT-style re-approve", () => {
    const cd = b.revokeApproval({ token: RAIL, spender: ME });
    const [, amount] = decodeAbiParameters([{ type: "address" }, { type: "uint256" }], ("0x" + cd.data.slice(10)) as Hex);
    expect(sel(cd)).toBe("0x095ea7b3");
    expect(amount).toBe(0n);
  });
  it("allowance → 0xdd62ed3e, and its tail is (owner, spender) in that order", () => {
    const cd = b.allowance({ token: RAIL, owner: ME, spender: ZERO });
    expect(sel(cd)).toBe("0xdd62ed3e");
    const [owner, spender] = decodeAbiParameters([{ type: "address" }, { type: "address" }], ("0x" + cd.data.slice(10)) as Hex);
    expect(owner).toBe(ME);
    expect(spender).toBe(ZERO);
  });
  it("batch (FleetExecutor.execute) → 0x74b506ec", () => {
    const cd = b.batch({ executor: RAIL, calls: [{ target: ME, value: 0n, data: "0x" }], nonce: 1n, deadline: 2n, sig: "0x" });
    expect(sel(cd)).toBe("0x74b506ec");
  });
  it("executeSelf → 0x114cbac9", () => {
    expect(sel(b.executeSelf({ executor: RAIL, calls: [{ target: ME, value: 0n, data: "0x" }] }))).toBe("0x114cbac9");
  });
  it("x402 markPaid (bytes32,address,address,uint256) → 0x7dffcf3b", () => {
    expect(sel(b.markPaid({ facilitator: RAIL, paymentId: PREIMAGE, to: ME, token: NATIVE, amount: 1n }))).toBe("0x7dffcf3b");
  });
  it("settlementRegistry markPaid (bytes32,uint256) → 0x39747824 — DIFFERENT from x402's", () => {
    const cd = b.markPaidRegistry({ registry: RAIL, paymentId: PREIMAGE, amount: 1n });
    expect(sel(cd)).toBe("0x39747824");
    // the two markPaid selectors must NOT coincide (a copy-paste would encode the wrong arity)
    expect(sel(cd)).not.toBe(sel(b.markPaid({ facilitator: RAIL, paymentId: PREIMAGE, to: ME, token: NATIVE, amount: 1n })));
  });

  // --- LIVE v2 builders: the published verbs the deployed factories actually dispatch on ---------
  // Selectors scanned PRESENT in the live runtime of g2b 0x1826C892… and g2a 0x8f26d7a5… (Base,
  // 2026-11-10), so a drift here is a mainnet revert, caught offline.
  it("createEscrowLive (live g2b create) → 0xa083c5e1", () => {
    expect(sel(b.createEscrowLive({ factory: RAIL, counterparty: ME, token: NATIVE, amount: 1n, hash: ZERO32, timeout: 600n }))).toBe("0xa083c5e1");
  });
  it("createEscrowLiveFor (live g2b 6-field createFor tuple) → 0xea6eb391", () => {
    const deal = { counterparty: ME, arbiter: ZERO, token: NATIVE, amount: 1n, hash: ZERO32, timeout: 600n };
    expect(sel(b.createEscrowLiveFor({ factory: RAIL, deal }))).toBe("0xea6eb391");
  });
  it("setMandateLive (live g2a setMandate) → 0x88f67583", () => {
    expect(sel(b.setMandateLive({ factory: RAIL, recipient: ME, token: NATIVE, ticket: 1n, period: 2592000n, laps: 12, t0: 1n }))).toBe("0x88f67583");
  });
});

describe("selectors agree with viem's own encoder (no hand-rolled drift)", () => {
  it("pay selector == encodeFunctionData via the abi constant", () => {
    const fromAbi = toFunctionSelector(paymentRailAbi.find((f) => f.name === "pay")!);
    expect(sel(b.pay({ rail: RAIL, to: ME, token: NATIVE, amount: 1n, memo: MEMO, referrer: ZERO }))).toBe(fromAbi);
  });
  it("outcome selector == encodeFunctionData via the abi constant", () => {
    const fromAbi = toFunctionSelector(escrowAbi.find((f) => f.name === "outcome")!);
    expect(sel(b.outcome({ escrow: RAIL }))).toBe(fromAbi);
  });
});

describe("encoded tails round-trip to the inputs", () => {
  it("pay tail decodes to (to, token, amount, memo, referrer)", () => {
    const cd = b.pay({ rail: RAIL, to: ME, token: NATIVE, amount: 12345n, memo: MEMO, referrer: ZERO });
    const [to, token, amount, memo, referrer] = decodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "uint256" }, { type: "bytes32" }, { type: "address" }],
      ("0x" + cd.data.slice(10)) as Hex,
    );
    expect(getAddress(to as string)).toBe(ME);
    expect(token).toBe(NATIVE);
    expect(amount).toBe(12345n);
    expect(memo).toBe(MEMO);
    expect(referrer).toBe(ZERO);
    expect(cd.value).toBe(0n);
  });

  it("pay carries native value when token is NATIVE and value is set", () => {
    const cd = b.pay({ rail: RAIL, to: ME, token: NATIVE, amount: 999n, memo: MEMO, referrer: ZERO, value: 999n });
    expect(cd.value).toBe(999n);
  });

  it("createFor tail's first word is the counterparty (Deal struct, ordered)", () => {
    const deal: EscrowDeal = { counterparty: ME, arbiter: ZERO, token: NATIVE, amount: 7n, hash: ZERO32, timeout: 600n, releaseGrace: 30n, hook: ZERO };
    const cd = b.createEscrow({ rail: RAIL, deal, referrer: ZERO });
    // head: deal (8 static words) + referrer. word0 = counterparty, word3 = amount, word5 = timeout.
    const body = cd.data.slice(10);
    const w = (i: number) => ("0x" + body.slice(i * 64, (i + 1) * 64)) as Hex;
    expect(getAddress(("0x" + w(0).slice(26)) as `0x${string}`)).toBe(ME);
    expect(BigInt(w(3))).toBe(7n);
    expect(BigInt(w(5))).toBe(600n);
  });

  it("sweep tail decodes to (tokens[], hops[], minOut[])", () => {
    const cd = b.sweep({
      sweeper: RAIL,
      tokens: [ME],
      hops: [{ venue: 0, tokenIn: ME, tokenOut: ME, feeTier: 500, venueRouter: ME }],
      minOut: [42n],
    });
    const [tokens, hops, minOut] = decodeAbiParameters(
      [
        { type: "address[]" },
        { type: "tuple[]", components: [{ type: "uint8" }, { type: "address" }, { type: "address" }, { type: "uint24" }, { type: "address" }] },
        { type: "uint256[]" },
      ],
      ("0x" + cd.data.slice(10)) as Hex,
    );
    expect((tokens as readonly string[])[0]).toBe(ME);
    expect((hops as readonly unknown[][])[0]![3]).toBe(500);
    expect((minOut as readonly bigint[])[0]!).toBe(42n);
  });
});

describe("addressBook", () => {
  it("parses + checksums, and rejects a bad entry", async () => {
    const { addressBook, checksum } = await import("../src/addressBook.js");
    const raw = { base: { paymentRail: RAIL, source: "doc" } };
    const book = addressBook(raw);
    expect(book.rail("base", "paymentRail")).toBe(RAIL);
    expect(() => checksum("0x1234")).toThrow();
  });

  it("resolve throws on a chain miss", async () => {
    const { addressBook } = await import("../src/addressBook.js");
    const book = addressBook({ base: { paymentRail: RAIL } });
    // @ts-expect-error — "nope" is not a ChainKey but the reader keys by string at runtime.
    expect(() => book.rail("nope", "paymentRail")).toThrow();
  });

  it("checksum REJECTS a corrupted mixed-case EIP-55 (viem getAddress alone would accept it)", async () => {
    const { checksum } = await import("../src/addressBook.js");
    // last char flipped 8→9 on an otherwise-valid mixed-case addr: getAddress normalises it silently,
    // so the pre-fix "EIP-55 check" (which only called getAddress) never fired.
    const corrupted = "0xe9515881fe6976eD9CB55328B8308F6eF7c311a9";
    expect(() => checksum(corrupted)).toThrow(/EIP-55/);
    // the true checksummed form passes, and an all-lowercase form is accepted (no checksum to contradict).
    expect(checksum("0x417c41d406c61E09958032Cd77338fc1F1ac7D45")).toBe(RAIL);
    expect(checksum("0x417c41d406c61E09958032Cd77338fc1F1ac7D45")).toBe(RAIL);
  });

  it("parses a nested v2 block and checksums it", async () => {
    const { addressBook } = await import("../src/addressBook.js");
    const V2 = getAddress("0x417c41d406c61E09958032Cd77338fc1F1ac7D45");
    const book = addressBook({ base: { paymentRail: RAIL, v2: { paymentRail: V2 } } });
    expect(book.book.base?.v2?.paymentRail).toBe(V2);
  });

  // --- SDK-1: the recorded line, so a builder can refuse new business at a paused forest --------
  it("carries `status` through, and status() reports it", async () => {
    const { addressBook } = await import("../src/addressBook.js");
    const book = addressBook({
      base: { paymentRail: RAIL, status: "live" },
      arbitrum: { paymentRail: RAIL, status: "v1-paused" },
    });
    expect(book.status("base")).toBe("live");
    expect(book.status("arbitrum")).toBe("v1-paused");
    // @ts-expect-error — off-book chain
    expect(book.status("nope")).toBeUndefined();
  });

  it("a status that is not live|v1-paused fails the parse rather than being carried as an address", async () => {
    const { addressBook } = await import("../src/addressBook.js");
    expect(() => addressBook({ base: { status: "paused-ish" } })).toThrow(/live\|v1-paused/);
  });

  // --- the SHIPPED book: these are the two defects, asserted against the real file -------------
  it("the shipped addresses.json: 3 live chains, 8 v1-paused, and no stored feeRecipient", async () => {
    const { addressBook } = await import("../src/addressBook.js");
    const raw = (await import("../addresses.json", { with: { type: "json" } })).default;
    const book = addressBook(raw);
    const chains = Object.keys(book.book);
    expect(chains.filter((c) => book.status(c as never) === "live").sort()).toEqual(["base", "optimism", "unichain"]);
    expect(chains.filter((c) => book.status(c as never) === "v1-paused")).toHaveLength(8);
    for (const c of chains) expect(book.book[c]?.feeRecipient).toBeUndefined();
    // every row still checksums (a stripped field must not have disturbed the address parse)
    expect(book.rail("base", "paymentRail")).toBe(RAIL);
  });

  // --- SDK-2: feeRecipient is live state, not a book constant ---------------------------------
  it("SUPPORTED_CHAINS is derived from status, not a literal — arbitrum falls out", async () => {
    const { addressBook } = await import("../src/addressBook.js");
    const raw = (await import("../addresses.json", { with: { type: "json" } })).default;
    const book = addressBook(raw);
    expect(book.supported().sort()).toEqual(["base", "optimism", "unichain"]);
    // the old literal named arbitrum; it is a v1-paused chain and must not appear
    expect(book.supported()).not.toContain("arbitrum");
    // but the address is still reachable — "supported" is about new business, not reachability
    expect(book.rail("arbitrum", "paymentRail")).toMatch(/^0xe9515881/);
  });

  it("a book with no status fields supports nothing rather than guessing", async () => {
    const { addressBook } = await import("../src/addressBook.js");
    expect(addressBook({ base: { paymentRail: RAIL } }).supported()).toEqual([]);
  });

  it("a chain block with no feeRecipient resolves none, so a stale copy cannot be read", async () => {
    const { addressBook } = await import("../src/addressBook.js");
    const book = addressBook({ base: { paymentRail: RAIL } });
    expect(book.book.base?.feeRecipient).toBeUndefined();
    expect(() => book.rail("base", "feeRecipient")).toThrow(/no feeRecipient/);
  });
});
