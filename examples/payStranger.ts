/**
 * HERO — "Pay a stranger safely in 5 lines".  Run: `npx tsx examples/payStranger.ts`
 *
 * The capability a 1% checkout processor does not have: lock funds against a condition, the
 * counterparty releases with the preimage, and YOU get an automatic refund if they never do
 * (the escrow opens `refund()` at `timeout`). No signup, no account, no intermediary holding keys —
 * the funds sit in the escrow contract.
 *
 * This runs REAL live reads (eth_call) against the deployed g2b factory on Base, not pseudocode:
 * it reads the live fee and predicts the escrow address the factory would mint for this exact deal.
 *
 * Fee framing: at 500 bps we are 5–12x a ~1% crypto processor ABOVE ~$14 — but this snippet is
 * about CAPABILITY (safe stranger-pay), where fee barely matters, not the plain-link door.
 */
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { escrowFactoryLiveAbi } from "../src/abi.js";
import * as b from "../src/buildCallData.js";
import { ZERO, ZERO32, ME, USDC_BASE, book, show } from "./_shared.js";

// --- 5 lines: build the escrow ----------------------------------------------------------------
const factory = book.book.base!.v2!.escrowRail!; // live g2b v2 EscrowFactory on Base
const client = createPublicClient({ chain: base, transport: http() });
const feeBps = await client.readContract({ address: factory, abi: escrowFactoryLiveAbi, functionName: "feeBps" });
const deal = {
  counterparty: ME, // the stranger who may release
  arbiter: ZERO, // no human arbiter — hashlock/timeout only
  token: USDC_BASE, // USDC on Base
  amount: 25_000_000n, // 25 USDC
  hash: ZERO32, // arbiter-only (no hashlock); for a hashlock pass keccak256(preimage)
  timeout: BigInt(Math.floor(Date.now() / 1000) + 3600), // refund opens in 1h
} as const;
const create = b.createEscrowLive({ factory, ...deal });

show("escrow factory (live v2)", factory);
show("live feeBps (read on-chain)", feeBps);
show("create calldata.to", create.to);
show("create calldata.data (send this, value 0)", create.data);

// prove it would land: the factory's own predict(payer, deal) — another live eth_call
const predicted = await client.readContract({
  address: factory,
  abi: escrowFactoryLiveAbi,
  functionName: "predict",
  args: [ME, deal],
});
show("escrow that would be minted (predict, live)", predicted);
