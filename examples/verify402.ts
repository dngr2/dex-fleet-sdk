/**
 * verify402 — the x402 gate. `tsx examples/verify402.ts`.
 * A server calls verify() before serving a paid resource: true iff `paymentId` settled ≥ minAmount
 * of `token` to exactly `to`. Mismatch on any field → false.
 */
import { verify402CallData, verify402, settlement } from "../src/modules/verify402.js";
import { ME, ZERO32, baseClient, book, show } from "./_shared.js";

const facilitator = (process.env.X402 as `0x${string}` | undefined);
if (!facilitator) {
  show("set X402=0x… (facilitator) to run the live path", "—");
} else {
  const paymentId = (process.env.PAYMENT_ID as `0x${string}` | undefined) ?? ZERO32;
  const token = (process.env.TOKEN as `0x${string}` | undefined) ?? ME;
  const args = { facilitator, paymentId, to: ME, token, minAmount: 1_000_000n } as const;

  const cd = verify402CallData(args);
  show("verify calldata.to", cd.to);
  show("verify calldata.data", cd.data);
  try {
    show("verify (settled ok?)", await verify402(baseClient(), args));
    show("settlement record", await settlement(baseClient(), { facilitator, paymentId }));
  } catch (e) {
    show("verify failed (RPC?)", (e as Error).message);
  }
}
