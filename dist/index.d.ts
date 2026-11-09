/**
 * @fleet/sdk — tree-shakeable TypeScript client for the DEX fleet rails.
 *
 * Three layers, each usable without the next:
 *   1. buildCallData — PURE `{to,data,value}` builders. No viem client, no network. Test these.
 *   2. modules       — thin client-bound actions (simulate → send) over the builders.
 *   3. client/eip712 — the viem seam + EIP-712 signing for the FleetExecutor batch.
 *
 * Nothing here holds state or a socket at import time; `addresses.json` is data you pass in.
 */
export * from "./types.js";
export * from "./abi.js";
export * from "./buildCallData.js";
export * from "./toll.js";
export * from "./addressBook.js";
export * from "./client.js";
export * from "./eip712.js";
export * as modules from "./modules/index.js";
//# sourceMappingURL=index.d.ts.map