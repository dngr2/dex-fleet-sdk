/**
 * release — settle an escrow child + read its outcome. `tsx examples/release.ts`.
 * `release` targets the ESCROW, not the factory. `outcome()` is the honest discriminator (1=released).
 */
import { releaseCallData, outcome } from "../src/modules/release.js";
import { baseClient, book, show } from "./_shared.js";

// point ESCROW at a real escrow address you hold; this default is illustrative
const escrow = process.env.ESCROW as `0x${string}` | undefined;
if (!escrow) {
  show("set ESCROW=0x… to run the live path", "skipped");
}

const PREIMAGE = `0x${"11".repeat(32)}` as const;
if (escrow) {
  const cd = releaseCallData({ escrow, preimage: PREIMAGE });
  show("release calldata.to", cd.to);
  show("release calldata.data", cd.data);
  try {
    show("outcome", await outcome(baseClient(), { escrow }));
  } catch (e) {
    show("outcome read failed", (e as Error).message);
  }
} else {
  show("release selector", releaseCallData({ escrow: book.rail("base", "escrowRail"), preimage: PREIMAGE }).data.slice(0, 10));
}
