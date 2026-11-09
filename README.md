<!-- published as dngr2/dex-fleet-sdk — a copy of products/sdk from the dex fleet monorepo -->

# @fleet/sdk

> **Source-only — nothing here is deployed.** This SDK talks to the **LIVE Base mainnet** contracts;
> the addresses it targets are in `addresses.json` (read + EIP-55 checked at runtime). No build step is
> required to read it: `src/` is the source, `dist/` is the compiled output of the same tree.
> See the FROZEN-vs-LIVE section below before wiring `quote()`.

Tree-shakeable TypeScript client for the DEX fleet rails — pure calldata builders + a thin viem
seam. No state at import time; `addresses.json` is data you pass in.

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
re-verified with `cast to-check-sum-address`. `addressBook()` checksums each on read and throws on
a malformed entry. Multi-chain: the same CREATE address recurs on Base/OP/Arbitrum for `paymentRail`
and `swapRouter`; `requestRegistry` (f1-a links) and `escrowRail`/`streamRail` are per-chain.
