"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modules = void 0;
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
__exportStar(require("./types.js"), exports);
__exportStar(require("./abi.js"), exports);
__exportStar(require("./buildCallData.js"), exports);
__exportStar(require("./toll.js"), exports);
__exportStar(require("./addressBook.js"), exports);
__exportStar(require("./client.js"), exports);
__exportStar(require("./eip712.js"), exports);
exports.modules = require("./modules/index.js");
