/**
 * approvals — the ERC-20 allowance half of the pull-based surfaces. Run: `npx tsx examples/approvals.ts`
 *
 * Two live reads and three pieces of calldata, nothing broadcast:
 *   1. what the factory's treasury address IS right now (`feeRecipient()` — never a constant, SDK-2)
 *   2. the brake (`paused()`) and the capability verdict for the create path (SDK-4)
 *   3. the exact-approve, the unlimited-approve, and the revoke, side by side
 *
 * The revoke row is the one the site forks hand-rolled and got wrong: a stream mandate survives as a
 * live allowance after `disarmMandate()`, so disarming the record is only half a revoke.
 */
import { createFleetClient, readFeeRecipient, capability, isPaused } from "../src/index.js";
import { streamFactoryLiveAbi } from "../src/abi.js";
import * as b from "../src/buildCallData.js";
import { book, show, ME, USDC_BASE } from "./_shared.js";

const factory = book.book.base!.v2!.streamRail!; // live g2a v2 StreamFactory
const client = createFleetClient({ chain: "base" });

// 1. the treasury, read live off the factory (SDK-2)
show("factory.feeRecipient() (live, read on-chain)", await readFeeRecipient(client, factory));

// 2. the brake + the verdict for the create path (SDK-4)
show("factory.paused() (live, read on-chain)", await isPaused(client, factory));
const cap = await capability(client, { to: factory, abi: streamFactoryLiveAbi, fn: "setMandate" });
show("capability(setMandate on the live factory)", `${cap.state} (ok=${cap.ok})`);

// 3. the three calls — `to` is always the TOKEN, the factory is the spender
const TICKET = 1_550_000n; // $1.55
const exact = b.approveExact({ token: USDC_BASE, spender: factory, amount: TICKET });
show("approveExact    calldata.to", exact.to);
show("approveExact    calldata.data", exact.data);
show("approveUnlimited calldata.data", b.approveUnlimited({ token: USDC_BASE, spender: factory }).data);
show("revokeApproval  calldata.data", b.revokeApproval({ token: USDC_BASE, spender: factory }).data);
show("owner stand-in (for the allowance read)", ME);
