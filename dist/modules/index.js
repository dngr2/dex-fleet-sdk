/**
 * @fleet/sdk/modules — the surfaces. Each module exports a PURE `*CallData` builder and a thin
 * client-bound action that simulates before it sends. Import only what you use (sideEffects:false).
 */
export * as quote from "./quote.js";
export * as pay from "./pay.js";
export * as createLink from "./createLink.js";
export * as createEscrow from "./createEscrow.js";
export * as release from "./release.js";
export * as setMandate from "./setMandate.js";
export * as executeLap from "./executeLap.js";
export * as swap from "./swap.js";
export * as sweep from "./sweep.js";
export * as verify402 from "./verify402.js";
export * as approvals from "./approvals.js";
//# sourceMappingURL=index.js.map