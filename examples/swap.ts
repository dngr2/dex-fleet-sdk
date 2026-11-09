/**
 * swap — p3 Router exact-in. `tsx examples/swap.ts`.
 * One hop USDC→… here; add Hops for a multi-hop route. `venue 0` = UniV3, `venue 1` = Aerodrome.
 */
import { swapCallData, previewFee } from "../src/modules/swap.js";
import { ME, USDC_BASE, baseClient, book, show } from "./_shared.js";
import type { Hop } from "../src/buildCallData.js";

const router = book.rail("base", "swapRouter");
const WETH = "0x4200000000000000000000000000000000000006" as const;

const hop: Hop = {
  venue: 0, // UniV3
  tokenIn: USDC_BASE,
  tokenOut: WETH,
  feeTier: 500,
  stable: false,
  venueRouter: "0x2626664c2603336E57B271c5C0b26F421741e481", // Uniswap SwapRouter02 (Base)
  factory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD", // Uniswap V3 factory (Base)
};

const cd = swapCallData({
  router,
  amountIn: 10_000_000n, // 10 USDC
  amountOutMin: 0n,
  hops: [hop],
  recipient: ME,
  deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
});
show("swap calldata.to", cd.to);
show("swap calldata.data head", cd.data.slice(0, 74));

try {
  show("previewFee(10 USDC)", await previewFee(baseClient(), { router, amountIn: 10_000_000n }));
} catch (e) {
  show("previewFee failed (RPC?)", (e as Error).message);
}
