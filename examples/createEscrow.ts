/**
 * createEscrow — build an escrow create. `tsx examples/createEscrow.ts`.
 * Uses the FROZEN 8-field Deal (createFor(deal, referrer)). For the LIVE 6-field factory, see README.
 */
import { createEscrowCallData } from "../src/modules/createEscrow.js";
import { ZERO32, ZERO, ME, USDC_BASE, book, show } from "./_shared.js";
import type { EscrowDeal } from "../src/types.js";

const rail = book.rail("base", "escrowRail");
const deal: EscrowDeal = {
  counterparty: ME,
  arbiter: ZERO,
  token: USDC_BASE,
  amount: 10_000_000n, // 10 USDC
  hash: ZERO32, // arbiter-only (no hashlock)
  timeout: 3600n, // refund opens in 1h
  releaseGrace: 600n, // 10m grace after timeout
  hook: ZERO,
};

const cd = createEscrowCallData({ rail, deal, referrer: ZERO });
show("createFor calldata.to", cd.to);
show("createFor calldata.data", cd.data);
show("value (0 for ERC-20)", cd.value);
