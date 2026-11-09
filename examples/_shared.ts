/**
 * Shared example helpers. Examples are RUNNABLE (`tsx examples/<name>.ts`) but never broadcast —
 * they build calldata, and where a surface has a view path they also read it live.
 */
import { createFleetClient, addressBook } from "../src/index.js";
import raw from "../addresses.json" with { type: "json" };

export const book = addressBook(raw);

/** A read-only Base client (public RPC). Override with RPC_URL to point at your own node. */
export function baseClient() {
  return createFleetClient({ chain: "base", ...(process.env.RPC_URL ? { rpcUrl: process.env.RPC_URL } : {}) });
}

export const ME = "0x27339Dd87d6A22414b79Dc7966526906bfBe92C2" as const;
export const NATIVE = "0x0000000000000000000000000000000000000000" as const;
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const ZERO32 = `0x${"00".repeat(32)}` as const;
export const ZERO = NATIVE;

export function show(label: string, v: unknown) {
  console.log(`${label}:`, typeof v === "bigint" ? v.toString() : v);
}
