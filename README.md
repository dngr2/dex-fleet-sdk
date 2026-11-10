# @fleet/sdk

**Pay a stranger safely, and charge a stranger on a schedule — self-custodial, no account, no
intermediary.** That is the capability; the fee is the footnote. This is the tree-shakeable
TypeScript client for the DEX fleet rails: pure calldata builders + a thin viem seam. No state at
import time; `addresses.json` is data you pass in.

Two things a 1% checkout processor cannot do, in five lines each — both snippets below are
**runnable** (`tsx examples/<name>.ts`) and issue **real live `eth_call`s**, not pseudocode:

1. **`examples/payStranger.ts` — pay a stranger safely.** Lock funds against a condition; the
   counterparty releases with the preimage; **you get an automatic refund if they never do** (the
   escrow opens `refund()` at `timeout`). The funds sit in the escrow contract — the processor never
   holds keys.
2. **`examples/recurringLink.ts` — charge a stranger a recurring $N.** Arm one standing mandate;
   after that **anyone may fire the next due lap with no further signature from you**, and the money
   sits in a per-stream vault you alone can revoke. No subscription server, no card on file.

```ts
// pay a stranger safely — hero; full file: examples/payStranger.ts
const factory = book.book.base!.v2!.escrowRail!;                 // live v2 EscrowFactory (Base)
const feeBps  = await client.readContract({ address: factory, abi: escrowFactoryLiveAbi, functionName: "feeBps" });
const deal    = { counterparty: stranger, arbiter: ZERO, token: USDC_BASE,
                  amount: 25_000_000n, hash: keccak256(preimage), timeout: in1h() } as const;
const { to, data } = b.createEscrowLive({ factory, ...deal });   // send this, value 0
// prove it lands: factory.predict(payer, deal) — another live eth_call
```

```ts
// charge a stranger a recurring $N — full file: examples/recurringLink.ts
const factory = book.book.base!.v2!.streamRail!;                 // live v2 StreamFactory (Base)
const feeBps  = await client.readContract({ address: factory, abi: streamFactoryLiveAbi, functionName: "feeBps" });
const { to, data } = b.setMandateLive({ factory, recipient: ME, token: USDC_BASE,
                                        ticket: 1_550_000n, period: 2_592_000n, laps: 12, t0: now() });
```

### The fee, in one honest line

At the current **500 bps** we are **5–12× a ~1% crypto processor *above ~$14 per transfer*** — and
roughly at parity or below a mainstream card processor's all-in cut for larger tickets. So: for a
plain link under ~$14 the fee is the story; **for the two capabilities above (safe stranger-pay,
standing mandate) the fee is barely the story at all** — nothing else self-custodial does both.

> **One-word caveat on "the factory".** A `StreamFactory` *vault* stores an immutable `factory()`
> that it reads for its rate — a vault lives for years and must keep reading *one* factory. So when
> prose here says "the factory", read it as **"a factory of this lineage"**; the current one is
> **v2.1**. Older vaults keep pointing at the factory they were born under; that pointer never moves.

## Layout

```
src/
  buildCallData.ts   PURE {to,data,value} builders — no RPC, unit-testable
  abi.ts             frozen ABI fragments (mirror the *frozen* interfaces, see below)
  types.ts           shared types (money is bigint; addresses are 0x${string})
  addressBook.ts     read + EIP-55 check addresses.json
  client.ts          the viem seam: publicClient (read/simulate) + optional walletClient (write)
  eip712.ts          EIP-712 typed-data for the FleetExecutor batch + mandate portal
  modules/           one thin module per surface (simulate → send over the builders)
addresses.json       live contract addresses (copied from source docs, never retyped)
examples/            one runnable example per surface (tsx examples/<name>.ts)
test/                vitest: pins each builder's selector + tail
```

## The three layers

1. **`buildCallData`** — pure. `{ to, data, value }` out, no network. Test these.
2. **`modules`** — thin: build → `simulate()` (eth_call + estimateGas) → `sendTransaction`.
3. **`client` / `eip712`** — the viem seam and signing.

Import only what you use; `sideEffects:false` keeps the bundle to the surface you touch.

```ts
import { addressBook, createFleetClient } from "@fleet/sdk";
import { pay } from "@fleet/sdk/modules";
import raw from "@fleet/sdk/addresses.json";

const book = addressBook(raw);
const client = createFleetClient({ chain: "base", account });
await pay(client, { rail: book.rail("base", "paymentRail"), to, token: NATIVE, amount, memo, referrer });
```

## FROZEN vs LIVE (read this before wiring `quote()`) — a DATED promise

`abi.ts` mirrors the **frozen BUILD-WAVE-1 interfaces** (exec1's `products/rails/src/*.sol`) —
the shape the wave codes against. The **live** deployments named in `addresses.json` are the
audited **v1** line, which does *not* yet implement every frozen read.

Probed live on Base (2026-11-09, two RPCs, `eth_call` + runtime selector scan):

| member | frozen rail | live p2 registry `0xe9515881…` | flips when |
|---|---|---|---|
| `feeBps()` | yes | **yes** (500) | — (already live) |
| `owner()` / `feeRecipient()` | — | yes (orphan `0xe218…204B`) | — |
| `register()` / `predict()` | — | yes | — |
| `quote(token,amount)` | yes | **NO** — selector `8f79306e` absent from runtime | **v2 factories fire** |
| `minFee(token)` | yes | **NO** — no `minFee()` getter in deployed bytecode | **v2 factories fire** |

**This table is a dated promise, not a permanent caveat.** The two `NO` rows are not "unimplemented
forever" — they are the FROZEN wave's surface, and they become callable **the moment the v2 factories
fire** (the deployment that replaces the v1 registries named here). Until then, a `quote()` call
against a listed live address **reverts**.

Meanwhile the live toll is real and computed on-chain: `FeeMath.toll(amount, feeBps, minFee)` inside
each Forwarder, reading `registry.minFee()` *state* (slot 2, currently 0) — the public getter is just
not deployed. `g2b` escrow, `g2a` stream, and `p3` router all likewise revert on `quote()`.

**The recommended live flow** (also the whole of `examples/liveQuote.ts`):

```ts
import { feeBps } from "@fleet/sdk/abi";        // read the live rate
import { quoteLive } from "@fleet/sdk";         // ONE client-side toll fn, mirrors FeeMath.toll

const bps  = await client.readContract({ address: rail, abi: paymentRailAbi, functionName: "feeBps" });
const minF = 0n;                                 // registry.minFee() slot-2 state; 0 until set
const q    = quoteLive({ amount, feeBps: bps, minFee: minF, token });   // { fee, out, total, token }
```

`src/toll.ts` is the **single named home** for this reproduction (not README prose) — it mirrors
`FeeMath.sol` wei-exact including the dust-SKIP `<=` boundary, pinned by `test/toll.test.ts`. When
v2 deploys and `quote()` becomes callable, this helper stays useful as a preview (and stays the
offline path); it does **not** become a second on-chain source of truth. `examples/quote.ts` shows
the frozen `quote()` path and fails gracefully.

## Surfaces

`quote` `pay` `createLink` `createEscrow` `release` `setMandate` `executeLap` `swap` `sweep` `verify402`
— plus `buildCallData.batch` / `executeSelf` for the FleetExecutor EIP-712 batch.

## Settled predicate (lane-10 rule)

For settlement reads use `paid(id).at != 0` (or the facilitator's `hasSettled` bool) — **never
`amount > 0`**: a legitimate zero-amount settle is real. `verify402` is read-only and matches.

## Scripts

```
npm run build      # tsc → dist/
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run example    # tsx examples/pay.ts
```

## Addresses

`addresses.json` values are copied from source docs/genesis receipts (GOTCHA #73) and EIP-55
re-verified with `cast to-check-sum-address`. `addressBook()` validates EIP-55 strictly on read
(`isAddress(addr,{strict:true})`) and, for a mixed-case input, requires `getAddress(addr) === addr`
so a *corrupted* checksum is caught, not silently normalised — plus a malformed entry throws.

**Multi-chain, with one honest seam.** `paymentRail` (p2) is the same CREATE address on all 10
chains — a CREATE address is `keccak(rlp(key,nonce))[12:]`, chain-independent. `swapRouter` (p3)
likewise recurs on 9 chains, but on **Base it is a DIFFERENT contract** at `0xEB28D5cA…`; and the
bare string `0x9651cD59…` is the Base f1a `requestRegistry` (2772 B) *and* the p3 Router on the other
9 chains (4270 B) — same string, different code **per chain**. Never key on a bare address without
its chain.

`requestRegistry` (f1-a), `receiptNft` (g4b), `escrowRail`/`streamRail` on Base, and the five Base
supporting contracts (`settlementRegistry`, `fleetExecutor`, `x402Facilitator`, `fleetPaymaster`,
`tollRegistry`) are Base-only or per-chain as listed. The nested **`v2`** block is the next-gen line
and is **Base-only (chainId 8453)** — the other 9 chains stay on the v1 addresses at each chain's top
level. A reader must **not** assume v2 is multi-chain.

> **v2-only builders revert on a v1 address.** A v2 surface pointed at a v1 addr (or a chain where
> the rail was never deployed) reverts. Guard with `supports(client, {to, abi, fn})` — an
> `eth_getCode` + selector-presence check, cached per client — or call `assertSupports`, which throws
> `NotDeployed` carrying `{to, selector}` before any broadcast.
