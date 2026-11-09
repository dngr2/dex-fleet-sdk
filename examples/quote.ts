/** quote — read a rail's live fee + net output. `tsx examples/quote.ts` (needs RPC for the live read). */
import { quoteCallData, quote } from "../src/modules/quote.js";
import { NATIVE, baseClient, book, show } from "./_shared.js";

const rail = book.rail("base", "paymentRail");

// 1. pure calldata — no RPC
const cd = quoteCallData({ rail, token: NATIVE, amount: 10_000_000_000_000_000n }); // 0.01 ETH
show("quote calldata.to", cd.to);
show("quote calldata.data", cd.data);

// 2. live read (simulate → decode)
const client = baseClient();
try {
  const q = await quote(client, { rail, token: NATIVE, amount: 10_000_000_000_000_000n });
  show("fee", q.fee);
  show("out", q.out);
  show("total", q.total);
} catch (e) {
  show("live quote failed (RPC?)", (e as Error).message);
}
