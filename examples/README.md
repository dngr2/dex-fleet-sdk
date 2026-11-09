# Examples

Runnable (`tsx examples/<name>.ts`), never broadcast — they build calldata and, where a surface has a
view path, read it live against Base.

**Start here: `liveQuote.ts`** — the recommended live flow end-to-end, proving the whole pattern on
chain in one command:

```
tsx examples/liveQuote.ts
```

It (1) reads `feeBps()` live off the payment rail, (2) reproduces the toll client-side via
`quoteLive` from `src/toll.ts`, (3) encodes the real `pay`, and (4) `simulate`s it. Verified output
(Base, 2026-11-09): `live feeBps: 500` → fee `0.0005` / out `0.0095` on 0.01 ETH; `simulate` returned
a real revert reason (payer unfunded), which is what proves it reached the chain — the example
catches it gracefully.

Per-surface: `quote` `pay` `createLink` `createEscrow` `release` `setMandate` `executeLap` `swap`
`sweep` `verify402`. `_shared.ts` holds the client + fixtures.

Note `quote.ts` exercises the FROZEN `quote()` and *fails gracefully* — the live v1 rails don't deploy
it yet (see the README FROZEN-vs-LIVE dated-promise table). `liveQuote.ts` is the working live path
until the v2 factories fire.
