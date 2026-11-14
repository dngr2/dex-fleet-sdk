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
the shape the wave codes against. `addresses.json` now carries the **new line** at the top level of
base, optimism and unichain (CREATE2-invariant), and **v1** on the other eight chains. Neither line
implements every frozen read.

Probed live on Base, re-dated **2026-11-13** (runtime selector scan on both the v1 registry
`0xe9515881…` and the new-line registry `0x417c41d4…`, plus `eth_call`):

| member | frozen rail | v1 registry | new-line registry `0x417c41d4…` |
|---|---|---|---|
| `feeBps()` | yes | **yes** (500) | **yes** (500) |
| `owner()` / `feeRecipient()` | — | yes (owner **and** recipient = `0xe218…204B`, orphan key) | yes (owner `0x038d7B32…`; recipient `0x5c0fc091…`, read live) |
| `register()` / `predict()` | — | yes | yes |
| `quote(token,amount)` | yes | **NO** — `8f79306e` absent from runtime, call reverts | **NO** — still absent, still reverts |
| `minFee()` (no-arg) | — | **NO** | **YES** — `24ec7590` live, returns `0` (also on g2a/g2b new-line rails) |
| `minFee(token)` (frozen sig) | yes | **NO** | **NO** — `5c9edb87` absent; the deployed getter takes no argument |
| `paused()` (**state**, not a member) | — | **TRUE** (brake on, `supports()` false) | false |

**The two `NO` rows are the frozen wave's surface, not a permanent caveat** — but note the shape
drift: `abi.ts` declares `minFee(token)`, while what actually deployed is a bare `minFee()`. A call
using the frozen signature reverts on every listed address, on both lines. `quote()` likewise
reverts everywhere; wire against the client-side helper below until a factory lands it. And the v1
line's brake is ON — see `status` under [Addresses](#addresses).

Meanwhile the live toll is real and computed on-chain: `FeeMath.toll(amount, feeBps, minFee)` inside
each Forwarder, reading `registry.minFee()` *state* (slot 2, currently 0) — that is the read the
new-line `minFee()` getter now exposes. `g2b` escrow, `g2a` stream, and `p3` router all still revert
on `quote()`.

**The recommended live flow** (also the whole of `examples/liveQuote.ts`):

```ts
import { feeBps } from "@fleet/sdk/abi";        // read the live rate
import { quoteLive } from "@fleet/sdk";         // ONE client-side toll fn, mirrors FeeMath.toll

const bps  = await client.readContract({ address: rail, abi: paymentRailAbi, functionName: "feeBps" });
const minF = 0n;                                 // no-arg registry.minFee() is live and returns 0
const q    = quoteLive({ amount, feeBps: bps, minFee: minF, token });   // { fee, out, total, token }
```

`src/toll.ts` is the **single named home** for this reproduction (not README prose) — it mirrors
`FeeMath.sol` wei-exact including the dust-SKIP `<=` boundary, pinned by `test/toll.test.ts`. When
v2 deploys and `quote()` becomes callable, this helper stays useful as a preview (and stays the
offline path); it does **not** become a second on-chain source of truth. `examples/quote.ts` shows
the frozen `quote()` path and fails gracefully.

## Surfaces

`quote` `pay` `createLink` `createEscrow` `release` `setMandate` `executeLap` `swap` `sweep` `verify402`
`approvals` — plus `buildCallData.batch` / `executeSelf` for the FleetExecutor EIP-712 batch.

### Approvals (SDK-3)

Pull-based surfaces need an allowance to the rail, and the builders here are exact-by-default:

```ts
import { approvals } from "@fleet/sdk/modules";
await approvals.approve(client, { token: USDC, spender: streamFactory, amount: 1_550_000n });
await approvals.revokeIfAny(client, { token: USDC, owner: me, spender: streamFactory }); // no-op at 0
```

`approveExact` self-expires with the pull; `approveUnlimited` (max uint256) is for a reel and is
opt-in. **A mandate revoke is two halves** — `disarmMandate()` clears the record, `revoke()` clears the
allowance; the site forks hand-rolled `2n**256n-1n` and did only the first.

## Modules

ESM and CommonJS both load (`exports` carries `import` and `require`; `require()` resolves
`dist/cjs/…`). Before SDK-6 only `import` existed, so a CJS consumer hit `ERR_PACKAGE_PATH_NOT_EXPORTED`
on a package that otherwise compiled for it.


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

`addresses.json` values are deployment facts copied from source docs/genesis receipts (GOTCHA #73) and EIP-55
re-verified with `cast to-check-sum-address`. `addressBook()` validates EIP-55 strictly on read
(`isAddress(addr,{strict:true})`) and, for a mixed-case input, requires `getAddress(addr) === addr`
so a *corrupted* checksum is caught, not silently normalised — plus a malformed entry throws.

**Multi-chain, with two honest seams.** A CREATE address is `keccak(rlp(key,nonce))[12:]`, so it is
chain-independent *within a generation* — which is exactly why the bare string means nothing without
its chain, and why there are two generations of the p3 router on the same chains.

| p3 router | where | state |
|---|---|---|
| `0x036645cA…` (4773 B) | base, optimism, unichain | **current** — `feeBps()` **500**, `treasury()` `0x5c0fc091…`, `p2Registry()` reverts |
| `0x9651cD59…` (4270 B) | arbitrum, linea, polygon, bsc, opbnb, mantle, gnosis, scroll **and optimism** | **v1** — `feeBps()` **5**, `treasury()` `0xe218…`, `p2Registry()` reverts |
| `0xEB28D5cA…` (4270 B) | **base only** — `swapRouterHistoric` | **superseded**, byte-identical to the v1 router |

The one sentence that used to be here — "on Base it is a DIFFERENT contract at `0xEB28D5cA…`" — was
true of the pre-relaunch line and is now wrong in both directions: Base is on the *same* string as
optimism and unichain, and `0xEB28D5cA…` is the old copy, not a Base special case. It stays in the
book as `swapRouterHistoric` rather than only in prose, so something can go red on it.

Note also that optimism carries **both** p3 strings — the new router at `swapRouter` and the v1 one at
`0x9651cD59…` — so "op is live" is true of the address in the `swapRouter` field and says nothing
about the other string being safe to route through.

The same two-generation trap sits in `p2`: the new registry is `0x417c41d4…` (6303 B) on base,
optimism and unichain, the v1 is `0xe9515881…` (4654 B) on the eight old chains, and the v1 string is
*also* still deployed (superseded, `paused() == true`) on base and optimism — but **not** on unichain.
And `0x9651cD59…` is additionally the **old Base f1a `requestRegistry`** (2772 B, answering
`p2Registry() == 0xe9515881…`); the live one is `0xeD395024…` (2904 B, `p2Registry() == 0x417c41d4…`).
Same bare string, different contract **per chain**. Never key on a bare address without its chain.

Every figure above was read on two RPCs per chain, 2026-11-14.

`requestRegistry` (f1-a), `receiptNft` (g4b), `escrowRail`/`streamRail` on Base, and the five Base
supporting contracts (`settlementRegistry`, `fleetExecutor`, `x402Facilitator`, `fleetPaymaster`,
`tollRegistry`) are Base-only or per-chain as listed. The nested **`v2`** block is the next-gen line
and is **Base-only (chainId 8453)**. The other chains stay at each chain's top level — and note that is
**not** "the other nine stay on v1": base, optimism and unichain all carry the current line at top
level (`$note_new_line`), so only the eight `v1-paused` blocks do. A reader must **not** assume `v2` is
multi-chain, and must not assume top level is v1 either.

### `status`: the eight v1 chains are PAUSED (SDK-1)

Every chain block carries `status` — `live` (base, optimism, unichain) or **`v1-paused`** (the other
eight). `v1-paused` is not a soft warning: `paused()` reads **true on all eight** (probed 2026-11-14 on
two RPCs per chain — arbitrum, linea, polygon, bsc, opbnb, mantle, gnosis, scroll), so every CREATE
verb on those registries reverts `Paused()`. Settlement against something already created is *not*
gated, so an existing escrow/stream keeps working. Base Sepolia is the one place v1 is still open
(`paused() == false`).

```ts
book.status("base");      // "live"
book.status("arbitrum");  // "v1-paused"
```

Correct the status with a live `paused()` read — never by editing the file's guess.

### `feeRecipient` is NOT in this file (SDK-2 — a consequence of SDK-1)

The field's *absence* is not the defect; the v1 railing is (previous section). But the treasury also moves (48h staged timelock on the new line), and every vault/escrow pays
`factory.feeRecipient()` at settlement — so a stored copy goes stale with no error anywhere. Read it:

```ts
import { readFeeRecipient } from "@fleet/sdk";
const treasury = await readFeeRecipient(client, factory);   // live eth_call, every time
```

Both lines today: new line (base/op/unichain) `0x5c0fc091…d2Ef3c`, every v1 chain and Base Sepolia
`0xe218E382…204B` (the orphan key's recipient). Those are observations, not constants.

### Guarding a send: `capability` / `canSend` / `assertCanSend` (SDK-4)

`supports()` is the go/no-go and answers **false for a paused rail** — the selector being present did
not help anyone sent to a v1 registry. `isDispatched()` is the deployment-only half; `capability()`
returns `ready` | `paused` | `not-deployed` when you need to know *which* gate failed, and throws on a
dead RPC rather than answering either way (#138). `assertCanSend()` throws `Paused` (right address,
shut) or `NotDeployed` (wrong address/generation) — different bugs, different exceptions.

`book.supported()` is derived from `status` (`["base","optimism","unichain"]` today), so it cannot go
stale the way the old `SUPPORTED_CHAINS` literal did by still naming arbitrum. `book.rail()` still
resolves a paused chain — "supported" is about new business, not reachability.

```ts
if (!(await supports(client, { to: factory, abi: streamFactoryLiveAbi, fn: "setMandate" }))) {
  const cap = await capability(client, { to: factory, abi: streamFactoryLiveAbi, fn: "setMandate" });
  if (cap.state === "paused") await waitForOpen();    // the address was fine; the brake is on
}
```
