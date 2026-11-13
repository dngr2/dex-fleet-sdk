# SDK address-book lane — delivery (exec8, 2026-11-11)

Lane: SDK address-book (4 items) + v2 addresses/snippet + snippet retarget + the delegated
`dngr2/dex-fleet-sdk` publish. All work under `products/sdk/`; nothing else touched (no
`dex-fleet-mcp`, no `dex-contracts`). Every address below was live code-probed on its chain this run
and EIP-55 re-verified via `cast to-check-sum-address`.

## 1. What landed (item → artifact)

- **R2-4 — 5 new Base contracts** in `addresses.json` (+ typed in `addressBook.ts`):
  `settlementRegistry`, `fleetExecutor`, `x402Facilitator`, `fleetPaymaster`, `tollRegistry`.
- **SDK-2 — strict EIP-55 `checksum()`**: now `isAddress(addr,{strict:true})` **and** — for a
  mixed-case input — `getAddress(addr)===addr`, so a *corrupted* checksum throws instead of being
  silently normalised. A corrupted-checksum test pins it (last char flipped → `/EIP-55/`).
- **R2-5 — `markPaid` split**: `x402Facilitator.markPaid(bytes32,address,address,uint256)` =
  `0x7dffcf3b` vs `settlementRegistry.markPaid(bytes32,uint256)` = `0x39747824`. Distinct builder
  (`markPaidRegistry`) + a test asserting the two selectors do **not** coincide. Writer-gated fns
  labelled `role:keeper` (`WRITER_GATED` map in `abi.ts`).
- **SDK-1 — `supports()` runtime gate**: `eth_getCode` + selector presence, cached per
  (client,address) via `WeakMap`; `assertSupports()` throws `NotDeployed{to,selector}` before any
  broadcast so a v2-only builder against a v1 addr fails offline.
- **v2 block**: nested Base-only `v2` object in `addresses.json` (9 addrs from
  `exec3/GATE6-MIGRATION-PLAN.md §1`), parsed by `parseRails()`.
- **Snippets**: `examples/payStranger.ts` (HERO, safe stranger-pay via escrow) +
  `examples/recurringLink.ts` (recurring standing mandate). Both COMPILE (rc0) and run real live
  `eth_call`s against the v2 factories on Base.

Gates (local + cold clone): `tsc --noEmit` rc0; `vitest run` **41/41** green.

## 2. Pin-bearing FILE list (addresses/selectors pinned here)

| file | pins |
|---|---|
| `addresses.json` | the address book; md5 `80a3706b774a7701a711cc8ccbaa45c2` |
| `src/abi.ts` | selector-bearing ABI fragments; `WRITER_GATED` role map |
| `src/addressBook.ts` | strict EIP-55 `checksum()`; `parseRails()` (incl. `v2`) |
| `src/buildCallData.ts` | builder → selector encoders (`markPaidRegistry`, `createEscrowLive*`, `setMandateLive`) |
| `src/client.ts` | `supports()` / `assertSupports()` / `NotDeployed` gate |
| `src/types.ts` | `NotDeployed`, `LiveEscrowDeal` |
| `test/buildCallData.test.ts` | every selector asserted vs `cast sig` + corrupted-checksum reject |

## 3. `cast to-check-sum-address` readback (10 addrs, all OK)

Every value below round-tripped through `cast to-check-sum-address` **unchanged** (input == output),
i.e. each is a valid canonical EIP-55 form as written in `addresses.json`:

```
OK  0xe9515881fe6976eD9CB55328B8308F6eF7c311a8   (p2 base)
OK  0x9651cD591cFe33E1b684e5d8541940e78724c749   (base f1a / p3 other-chains)
OK  0xEB28D5cA0783D01dd2E4bF86AD7024ca156aB047   (p3 base)
OK  0x1826C89228f3A4D0ec8f437CFdd55a02D165F1ba   (v2 escrowRail)
OK  0x8f26d7a5C89B6b8BE712346c5465b7F50e84fa19   (v2 streamRail)
OK  0x773b19856D3B477A071323B726c7f72DbB5B6e48   (settlementRegistry)
OK  0x8943793970d2B29180A1B30166c0e326Bc94d2D4   (fleetExecutor)
OK  0xED79DE434D2a2633EedD95890E35637f0d41AEb3   (x402Facilitator)
OK  0x51B6c98a857E19FBC5C3f85b04D28E8f91c54426   (fleetPaymaster)
OK  0x39019ECf94A54EB9D62e7cBc1bB66724aA1db70a   (tollRegistry)
```

**These five are the pre-relaunch addresses.** `addresses.json` itself has since moved on
(`x402Facilitator` → `0x5849eF6f…`, `settlementRegistry` → `0xdDA0728F…`); the block above is a
historical EIP-55 conformance sample, not the current book. Writer gating on the live pair is satisfied
for `x402writer` `0xD85661ED…` on both, Base/OP/Uni (`products/settlement/DEPLOY-EVIDENCE.md`).

## 4. g2a / g2b OP-row confirmation

**RE-READ 2026-11-12 (the paragraph below the line is the stale one, kept as history):** the OP row no
longer carries those v1 rails — it carries the v2.1 lineup (`streamRail 0x3882A049…` 16643 B,
`escrowRail 0x4B05fA6a…` 10425 B), both measured on three OP RPCs. The v1 copies are still DEPLOYED
there (`0x61AB1942…` 9385 B, `0x80793a7d…` 7794 B, both now paused) — superseded, not absent.

~~`addresses.json` OP row carries `streamRail 0x61AB1942…` (g2a-OP) and `escrowRail 0x80793a7d…`
(g2b-OP) — matching `products/revenue/FEE-RAISE-PLAN.md §CLOSED`.~~ Collision note in `$comment`:
`0x9651cD59…` is Base-RequestRegistry but OP/9-chain-Router; `0x61AB1942…` is OP-StreamFactory but a
vault elsewhere — never key on a bare address without its chain (#95).

## 5. v2 selectors (live-scanned, distinct from the frozen ABIs)

The frozen 8-field / signed-portal selectors are **absent** on the live v2 factories; the live verbs
dispatch differently, so live builders were added and pinned:

| live verb | selector | status on live runtime |
|---|---|---|
| g2b `create(address,address,uint256,bytes32,uint64)` | `0xa083c5e1` | PRESENT |
| g2b `createFor(6-field tuple)` | `0xea6eb391` | PRESENT |
| g2b `predict(address,tuple)` | `0x2a67672b` | PRESENT |
| g2a `setMandate(address,address,uint256,uint64,uint32,uint64)` | `0x88f67583` | PRESENT |
| g2a `predict(address,address,address,uint256,uint64,uint64)` | `0xce580c87` | PRESENT |

Frozen `createFor` `0xd9b22c47` / `setMandateFor` `0x1370269f` remain valid against the **frozen**
rails interface, not the live factories.

## 6. Publish — `dngr2/dex-fleet-sdk`

- Repo was STALE (v1-era, last push 2026-11-09T06:18Z; no v2 block; pre-`markPaid`-split).
- Published from a FRESH CLONE: copied `products/sdk/`, excluded `node_modules` (one-line `.gitignore`),
  kept `dist/` vendored (76 files, byte-current with `src/`).
- Commit `07992c2f8f48669d0a3319e8cf5246c23f159afd`, author `dngr2 <dngr2@users.noreply.github.com>`,
  **no trailer**.
- **GATES before push (in clone)**: `npx tsc --noEmit` → rc0; `npx vitest run` → 41/41 green.
- **Cold-clone gate (fresh clone FROM the pushed repo)**: `npx tsc --noEmit` → rc0;
  `npx vitest run` → 41/41 green; both hero snippets `tsx`-run live against Base (rc0).
- `node_modules` **absent** from the tracked tree (121 tracked files; 76 under `dist/`).
- README/MANIFEST: capability-first lead, fee-landscape line, and the one-line caveat that a
  StreamFactory VAULT's `factory()` is immutable — "the factory" in prose = "a factory of this
  lineage" (current = v2.1).

## 7. Honest seams (carry forward)

- The nested `v2` block is **Base-only**; the other 9 chains stay on v1. `$note_v2_base_only` says so.
- f1c v2 `0x6f21409A…` is SUPERSEDED → `0x4B360a12…` (duster) used.
- g2a v2 streamRail recorded as `0x8f26d7a5…` (16643 B, v2.1, un-paused) — confirmed cold by critic,
  not the stale `0x14bBd99B…` literal.
- g2a/g2b OP rows confirmed as above.
