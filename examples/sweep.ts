/**
 * sweep — f1-c DustSweeper. `tsx examples/sweep.ts`.
 * Pulls full balances of the listed tokens via Permit2 and one-hops each to USDC, to the caller.
 * The user must have approved Permit2 per token first (out of SDK scope). DustSweeper is Base-only.
 */
import { sweepCallData } from "../src/modules/sweep.js";
import { USDC_BASE, book, show } from "./_shared.js";
import type { SweepHop } from "../src/buildCallData.js";

const WETH = "0x4200000000000000000000000000000000000006" as const;
const sweeper = (process.env.SWEEPER as `0x${string}` | undefined) ?? book.rail("base", "swapRouter");

const hop: SweepHop = {
  venue: 0, // UniV3 only (the duster rejects other ids)
  tokenIn: WETH,
  tokenOut: USDC_BASE,
  feeTier: 500,
  venueRouter: "0x2626664c2603336E57B271c5C0b26F421741e481",
};

const cd = sweepCallData({ sweeper, tokens: [WETH], hops: [hop], minOut: [0n] });
show("sweep calldata.to", cd.to);
show("sweep calldata.data", cd.data);
