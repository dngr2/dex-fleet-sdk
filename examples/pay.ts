/**
 * pay — build a `pay` call and (optionally) send it. `tsx examples/pay.ts`.
 * Without a private key it prints the calldata; with PRIVATE_KEY set it simulates, then sends.
 */
import { privateKeyToAccount } from "viem/accounts";
import { payCallData, payDryRun, pay } from "../src/modules/pay.js";
import { createFleetClient } from "../src/index.js";
import { NATIVE, ME, ZERO, ZERO32, baseClient, book, show } from "./_shared.js";

const rail = book.rail("base", "paymentRail");
const args = {
  rail,
  to: ME, // recipient
  token: NATIVE, // ETH rail — pass value too
  amount: 10_000_000_000_000_000n, // 0.01 ETH
  memo: ZERO32,
  referrer: ZERO,
  value: 10_000_000_000_000_000n,
} as const;

const cd = payCallData(args);
show("pay to rail", cd.to);
show("pay data", cd.data);
show("pay value", cd.value);

const pk = process.env.PRIVATE_KEY as `0x${string}` | undefined;
if (pk) {
  const account = privateKeyToAccount(pk);
  const client = createFleetClient({ chain: "base", account, ...(process.env.RPC_URL ? { rpcUrl: process.env.RPC_URL } : {}) });
  const sim = await payDryRun(client, args);
  show("simulate gas", sim.gas);
  show("tx", await pay(client, args));
} else {
  const sim = await payDryRun(baseClient(), args);
  show("simulate gas (read-only client)", sim.gas);
}
