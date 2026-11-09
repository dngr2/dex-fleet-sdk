/**
 * liveQuote — the RECOMMENDED live flow end-to-end, and the doc's front page.
 * `tsx examples/liveQuote.ts` (needs RPC).
 *
 * Why this exists: the live v1 rails have NO `quote()` (it reverts — see README FROZEN-vs-LIVE).
 * So to price a pay live you: (1) read `feeBps()` off the rail, (2) reproduce FeeMath.toll
 * client-side via the one named helper `quoteLive`, (3) encode the real `pay`, (4) simulate it so
 * a doomed tx never broadcasts. When v2 deploys and `quote()` becomes callable, this stays valid as
 * a preview path.
 */
import { paymentRailAbi } from "../src/abi.js";
import { quoteLive } from "../src/toll.js";
import { payCallData } from "../src/modules/pay.js";
import { simulate } from "../src/client.js";
import { ME, NATIVE, ZERO, ZERO32, baseClient, book, show } from "./_shared.js";

const rail = book.rail("base", "paymentRail");
const client = baseClient();
const amount = 10_000_000_000_000_000n; // 0.01 ETH

// 1. read the LIVE rate off the rail (feeBps IS deployed; quote() is not).
const bps = (await client.publicClient.readContract({
  address: rail,
  abi: paymentRailAbi,
  functionName: "feeBps",
})) as number;
show("live feeBps", bps);

// 2. client-side toll — FeeMath.toll semantics (registry.minFee is slot-2 STATE, 0 until set).
const minFee = 0n;
const q = quoteLive({ amount, feeBps: BigInt(bps), minFee, token: NATIVE });
show("client-side fee", q.fee);
show("client-side out (recipient gets)", q.out);

// 3. encode the real pay with the quoted numbers (value funds a native pay).
const cd = payCallData({
  rail,
  to: ME,
  token: NATIVE,
  amount,
  memo: ZERO32,
  referrer: ZERO,
  value: amount,
});
show("pay calldata.to", cd.to);
show("pay calldata.data head", cd.data.slice(0, 74));

// 4. simulate — eth_call + estimateGas before any broadcast.
try {
  const { gas } = await simulate(client, { account: ME, to: cd.to, data: cd.data, value: cd.value });
  show("simulate gas", gas);
} catch (e) {
  show("simulate failed (RPC? or unfunded payer?)", (e as Error).message);
}
