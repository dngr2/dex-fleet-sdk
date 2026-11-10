/**
 * SECOND — "Charge a stranger a recurring $N, in 5 lines".  Run: `npx tsx examples/recurringLink.ts`
 *
 * The capability a checkout processor does not have: a STANDING, self-custodial allowance. You arm
 * one mandate ("$1.55 every 30 days, 12 times"); after that ANYONE may fire the next due lap with no
 * further signature from you — the money sits in a per-stream vault only you can revoke. No
 * subscription server, no account, no card on file.
 *
 * This runs REAL live reads (eth_call) against the deployed g2a v2 StreamFactory on Base: it reads the
 * live rate + per-withdraw floor and predicts the vault address the factory would mint for lap 1.
 * Nothing is broadcast.
 *
 * Fee framing: 500 bps is 5–12x a ~1% crypto processor ABOVE ~$14/charge; a $1.55 charge clears the
 * 2,592,000s (30-day) MIN_DURATION floor, and `minFee()` is the deployed per-withdraw dust guard.
 */
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { streamFactoryLiveAbi } from "../src/abi.js";
import * as b from "../src/buildCallData.js";
import { ME, USDC_BASE, book, show } from "./_shared.js";

// --- 5 lines: arm the recurring charge --------------------------------------------------------
const factory = book.book.base!.v2!.streamRail!; // live g2a v2 StreamFactory on Base
const client = createPublicClient({ chain: base, transport: http() });
const feeBps = await client.readContract({ address: factory, abi: streamFactoryLiveAbi, functionName: "feeBps" });
const minFee = await client.readContract({ address: factory, abi: streamFactoryLiveAbi, functionName: "minFee" });
const PERIOD = 2_592_000n; // 30 days (>= the factory's MIN_DURATION floor)
const TICKET = 1_550_000n; // $1.55 USDC per lap
const LAPS = 12;
const t0 = BigInt(Math.floor(Date.now() / 1000));
const arm = b.setMandateLive({ factory, recipient: ME, token: USDC_BASE, ticket: TICKET, period: PERIOD, laps: LAPS, t0 });

show("stream factory (live v2)", factory);
show("live feeBps (read on-chain)", feeBps);
show("live minFee (per-withdraw floor, read on-chain)", minFee);
show("setMandate calldata.to", arm.to);
show("setMandate calldata.data (send this, value 0)", arm.data);

// prove lap 1 lands where you expect: the factory's own predict(...) for the first window — a live eth_call
const vault1 = await client.readContract({
  address: factory,
  abi: streamFactoryLiveAbi,
  functionName: "predict",
  args: [ME, ME, USDC_BASE, TICKET, t0, t0 + PERIOD],
});
show("vault that lap 1 would mint (predict, live)", vault1);
show("laps armed (ticket x laps)", TICKET * BigInt(LAPS));
