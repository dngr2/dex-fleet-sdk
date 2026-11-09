/**
 * createLink — f1-a payment link. `tsx examples/createLink.ts`.
 * Builds the `request()` calldata and reads the deposit address it WOULD mint (no tx → the link is
 * shareable before anyone pays; the salt is caller-independent).
 */
import { createLinkCallData, predictDepositFor } from "../src/modules/createLink.js";
import { ZERO32, ZERO, ME, baseClient, book, show } from "./_shared.js";

const registry = book.rail("base", "requestRegistry");
const args = { registry, destination: ME, token: ZERO, amount: 5_000_000n, memo: ZERO32 } as const;

const cd = createLinkCallData(args);
show("request calldata.to", cd.to);
show("request calldata.data", cd.data);

try {
  const deposit = await predictDepositFor(baseClient(), { registry, destination: ME });
  show("deposit address request() WOULD mint", deposit);
  show("shareable link", `https://pay…/?to=${ME}&amt=5`);
} catch (e) {
  show("predict failed (RPC?)", (e as Error).message);
}
