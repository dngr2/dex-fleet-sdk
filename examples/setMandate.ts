/**
 * setMandate — publish a recurring mandate. `tsx examples/setMandate.ts`.
 * Frozen signed portal (setMandateFor with a sig) + the live owner=payer form (setMandateLive).
 */
import { setMandateCallData, setMandateLiveCallData } from "../src/modules/setMandate.js";
import { ME, USDC_BASE, ZERO, book, show } from "./_shared.js";

const rail = book.rail("base", "streamRail");
const ZERO_SIG = "0x" as const; // a real call carries the payer's EIP-712 signature (see eip712.signMandate)

const signed = setMandateCallData({
  rail,
  payer: ME,
  recipient: ME,
  token: USDC_BASE,
  ticket: 1_550_000n, // $1.55 USDC per period (the g2a-sub min ticket, UNIT-ECON)
  period: 2_592_000n, // 30 days
  laps: 12,
  referrer: ZERO,
  sig: ZERO_SIG,
});
show("setMandateFor calldata.to", signed.to);
show("setMandateFor calldata.data", signed.data);

// live g2a owner=payer form
const live = setMandateLiveCallData({
  factory: rail,
  recipient: ME,
  token: USDC_BASE,
  ticket: 1_550_000n,
  period: 2_592_000n,
  laps: 12,
  t0: BigInt(Math.floor(Date.now() / 1000)),
});
show("setMandate(live) selector", live.data.slice(0, 10));
