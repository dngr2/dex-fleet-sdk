/**
 * executeLap — keeper tick. `tsx examples/executeLap.ts`.
 * Permissionless: asks what is due, then fires the next lap. `dueLaps` is the read path.
 */
import { executeLapCallData, executeLap, dueLaps } from "../src/modules/executeLap.js";
import { ZERO32, baseClient, book, show } from "./_shared.js";

const rail = book.rail("base", "streamRail");
const client = baseClient();

try {
  const due = await dueLaps(client, { rail, fromMandateId: ZERO32, count: 20n });
  show("due mandate ids", due);
  const first = due[0];
  if (first) {
    show("executeLap calldata", executeLapCallData({ rail, mandateId: first }).data);
    // executeLap(client, { rail, mandateId: first }) with a funded wallet to fire it
  } else {
    show("nothing due", "—");
  }
} catch (e) {
  show("dueLaps failed (RPC?)", (e as Error).message);
}
