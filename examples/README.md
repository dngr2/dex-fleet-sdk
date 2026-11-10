# Examples

Runnable (`tsx examples/<name>.ts`), never broadcast — they build calldata and, where a surface has a
view path, read it live against Base.

**Start with the two CAPABILITY heroes** — each is 5-ish lines, each issues real live `eth_call`s
against the deployed v2 factories on Base, and each is a thing a 1% checkout processor cannot do:

1. **`payStranger.ts` — pay a stranger safely.** Locks funds against a condition; the counterparty
   releases with the preimage; **you get an automatic refund if they never do**. Reads live `feeBps()`
   off the g2b v2 EscrowFactory, builds `create`, and `predict`s the escrow address it would mint.
   ```
   tsx examples/payStranger.ts
   ```
2. **`recurringLink.ts` — charge a stranger a recurring $N.** Arms one standing mandate; after that
   anyone may fire the next due lap with no further signature. Reads live `feeBps()`/`minFee()` off
   the g2a v2 StreamFactory, builds `setMandate` (selector `0x88f67583`), and `predict`s lap 1's vault.
   ```
   tsx examples/recurringLink.ts
   ```

Verified output (Base, 2026-11-10): hero → `feeBps=500`, `predict` → `0x7AEaCCC8…`; second →
`feeBps=500`, `minFee=0`, `predict` → `0x4bD3f841…`.

**Also recommended: `liveQuote.ts`** — the frozen-vs-live toll path end-to-end (1) reads `feeBps()`
live, (2) reproduces the toll client-side via `quoteLive`, (3) encodes `pay`, (4) `simulate`s it.

Per-surface: `quote` `pay` `createLink` `createEscrow` `release` `setMandate` `executeLap` `swap`
`sweep` `verify402`. `_shared.ts` holds the client + fixtures.

Note `quote.ts` exercises the FROZEN `quote()` and *fails gracefully* — the live v1 rails don't deploy
it yet (see the README FROZEN-vs-LIVE dated-promise table; v2 deploys it — the hero snippets use the
live v2 path).
