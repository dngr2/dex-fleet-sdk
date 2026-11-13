/**
 * Frozen ABI fragments for the fleet surfaces.
 *
 * PRIMARY SOURCE (copied, never retyped — GOTCHA #73): the FROZEN BUILD-WAVE-1 interfaces exec1
 * landed on disk. `paymentRailAbi` / `escrowRailAbi` / `streamRailAbi` mirror
 * products/rails/src/{IPaymentRail,IEscrowRail,IStreamRail}.sol member-for-member. The escrow
 * child (release/refund) and the product surfaces not covered by a rails interface (RequestRegistry
 * links, the p3 Router, the DustSweeper, the x402Facilitator verifier, the FleetExecutor batch) are
 * mirrored from their own live sources, named in each block.
 *
 * `as const` so viem infers argument/return types from these fragments at compile time, and so the
 * whole module stays tree-shakeable (`sideEffects:false`).
 *
 * DIVERGENCE NOTE: these are the WAVE-1 shapes the wave codes against. `addresses.json` now carries
 * the new line on base/optimism/unichain and v1 on the other eight chains; both differ from the frozen
 * shapes where noted (`g2b EscrowFactory.createFor` takes a 6-field Deal, no referrer; `g2a
 * StreamFactory` uses `setMandate(...)` not `setMandateFor(...sig)`; the frozen `minFee(address)` is
 * deployed as a bare `minFee()` and `quote(token,amount)` is absent from every line — see README
 * "frozen vs live"). Both shapes are exposed; `quoteLive()` is the client-side stand-in for `quote()`.
 */
/** IPaymentRail — products/rails/src/IPaymentRail.sol (frozen). */
export const paymentRailAbi = [
    { type: "function", name: "feeBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
    {
        type: "function",
        name: "minFee",
        stateMutability: "view",
        inputs: [{ name: "token", type: "address" }],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "quote",
        stateMutability: "view",
        inputs: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [
            { name: "fee", type: "uint256" },
            { name: "out", type: "uint256" },
        ],
    },
    {
        type: "function",
        name: "pay",
        stateMutability: "payable",
        inputs: [
            { name: "to", type: "address" },
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "memo", type: "bytes32" },
            { name: "referrer", type: "address" },
        ],
        outputs: [{ name: "paymentId", type: "bytes32" }],
    },
    {
        type: "event",
        name: "Paid",
        inputs: [
            { name: "paymentId", type: "bytes32", indexed: true },
            { name: "payer", type: "address", indexed: true },
            { name: "to", type: "address", indexed: true },
            { name: "token", type: "address", indexed: false },
            { name: "amount", type: "uint256", indexed: false },
            { name: "fee", type: "uint256", indexed: false },
            { name: "memo", type: "bytes32", indexed: false },
            { name: "referrer", type: "address", indexed: false },
        ],
    },
];
/**
 * The DEPLOYED minFee shape. The frozen interface names `minFee(address token)`; what actually shipped
 * on the new line is a no-arg `minFee()` (`0x24ec7590`, live on the p2 registry, g2a streamRail and g2b
 * escrowRail — all return 0 as of 2026-11-13). Kept as its own fragment so `paymentRailAbi` stays a
 * faithful mirror of the frozen interface while a reader can still call the deployed getter.
 */
export const paymentRailLiveAbi = [
    { type: "function", name: "feeBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
    { type: "function", name: "minFee", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
];
/** IEscrowRail — products/rails/src/IEscrowRail.sol (frozen), factory side. */
export const escrowRailAbi = [
    {
        type: "function",
        name: "createFor",
        stateMutability: "payable",
        inputs: [
            {
                name: "d",
                type: "tuple",
                components: [
                    { name: "counterparty", type: "address" },
                    { name: "arbiter", type: "address" },
                    { name: "token", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "hash", type: "bytes32" },
                    { name: "timeout", type: "uint64" },
                    { name: "releaseGrace", type: "uint64" },
                    { name: "hook", type: "address" },
                ],
            },
            { name: "referrer", type: "address" },
        ],
        outputs: [{ name: "escrow", type: "address" }],
    },
    {
        type: "function",
        name: "createForPayer",
        stateMutability: "payable",
        inputs: [
            {
                name: "d",
                type: "tuple",
                components: [
                    { name: "counterparty", type: "address" },
                    { name: "arbiter", type: "address" },
                    { name: "token", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "hash", type: "bytes32" },
                    { name: "timeout", type: "uint64" },
                    { name: "releaseGrace", type: "uint64" },
                    { name: "hook", type: "address" },
                ],
            },
            { name: "payer", type: "address" },
            { name: "sig", type: "bytes" },
        ],
        outputs: [{ name: "escrow", type: "address" }],
    },
];
/** The escrow CHILD (live g2b Escrow + frozen IEscrowRail's escrow-side reads). */
export const escrowAbi = [
    {
        type: "function",
        name: "release",
        stateMutability: "nonpayable",
        inputs: [{ name: "preimage", type: "bytes32" }],
        outputs: [],
    },
    { type: "function", name: "refund", stateMutability: "nonpayable", inputs: [], outputs: [] },
    { type: "function", name: "arbiterRelease", stateMutability: "nonpayable", inputs: [], outputs: [] },
    { type: "function", name: "arbiterRefund", stateMutability: "nonpayable", inputs: [], outputs: [] },
    { type: "function", name: "outcome", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
    { type: "function", name: "sweepExcess", stateMutability: "nonpayable", inputs: [], outputs: [{ type: "uint256" }] },
    { type: "function", name: "settled", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
    {
        type: "event",
        name: "Released",
        inputs: [
            { name: "preimage", type: "bytes32", indexed: false },
            { name: "to", type: "address", indexed: true },
            { name: "amountIn", type: "uint256", indexed: false },
            { name: "fee", type: "uint256", indexed: false },
            { name: "out", type: "uint256", indexed: false },
            { name: "by", type: "address", indexed: false },
        ],
    },
    {
        type: "event",
        name: "Refunded",
        inputs: [
            { name: "to", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
            { name: "by", type: "address", indexed: false },
        ],
    },
];
/** Live g2b EscrowFactory.createFor — 6-field Deal (no referrer/grace/hook). */
export const escrowFactoryLiveAbi = [
    {
        type: "function",
        name: "create",
        stateMutability: "nonpayable",
        inputs: [
            { name: "counterparty", type: "address" },
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "hash", type: "bytes32" },
            { name: "timeout", type: "uint64" },
        ],
        outputs: [{ name: "escrow", type: "address" }],
    },
    {
        type: "function",
        name: "createFor",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "d",
                type: "tuple",
                components: [
                    { name: "counterparty", type: "address" },
                    { name: "arbiter", type: "address" },
                    { name: "token", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "hash", type: "bytes32" },
                    { name: "timeout", type: "uint64" },
                ],
            },
        ],
        outputs: [{ name: "escrow", type: "address" }],
    },
    {
        type: "function",
        name: "predict",
        stateMutability: "view",
        inputs: [
            { name: "payer", type: "address" },
            {
                name: "d",
                type: "tuple",
                components: [
                    { name: "counterparty", type: "address" },
                    { name: "arbiter", type: "address" },
                    { name: "token", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "hash", type: "bytes32" },
                    { name: "timeout", type: "uint64" },
                ],
            },
        ],
        outputs: [{ type: "address" }],
    },
    { type: "function", name: "feeBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint16" }] },
];
/** IStreamRail — products/rails/src/IStreamRail.sol (frozen), signed-mandate portal. */
export const streamRailAbi = [
    {
        type: "function",
        name: "setMandateFor",
        stateMutability: "nonpayable",
        inputs: [
            { name: "payer", type: "address" },
            { name: "recipient", type: "address" },
            { name: "token", type: "address" },
            { name: "ticket", type: "uint256" },
            { name: "period", type: "uint64" },
            { name: "laps", type: "uint32" },
            { name: "referrer", type: "address" },
            { name: "sig", type: "bytes" },
        ],
        outputs: [{ name: "mandateId", type: "bytes32" }],
    },
    {
        type: "function",
        name: "executeLap",
        stateMutability: "nonpayable",
        inputs: [{ name: "mandateId", type: "bytes32" }],
        outputs: [{ name: "vault", type: "address" }],
    },
    {
        type: "function",
        name: "dueLaps",
        stateMutability: "view",
        inputs: [
            { name: "fromMandateId", type: "bytes32" },
            { name: "count", type: "uint256" },
        ],
        outputs: [{ type: "bytes32[]" }],
    },
    {
        type: "function",
        name: "mandatesOf",
        stateMutability: "view",
        inputs: [{ name: "payer", type: "address" }],
        outputs: [{ type: "bytes32[]" }],
    },
    {
        type: "function",
        name: "revokeMandate",
        stateMutability: "nonpayable",
        inputs: [{ name: "mandateId", type: "bytes32" }],
        outputs: [],
    },
    {
        type: "event",
        name: "MandateSet",
        inputs: [
            { name: "mandateId", type: "bytes32", indexed: true },
            { name: "payer", type: "address", indexed: true },
            { name: "recipient", type: "address", indexed: false },
            { name: "token", type: "address", indexed: false },
            { name: "ticket", type: "uint256", indexed: false },
            { name: "period", type: "uint64", indexed: false },
            { name: "laps", type: "uint32", indexed: false },
            { name: "referrer", type: "address", indexed: false },
        ],
    },
    {
        type: "event",
        name: "LapExecuted",
        inputs: [
            { name: "mandateId", type: "bytes32", indexed: true },
            { name: "vault", type: "address", indexed: true },
            { name: "lapIndex", type: "uint32", indexed: false },
            { name: "start", type: "uint64", indexed: false },
            { name: "end", type: "uint64", indexed: false },
        ],
    },
];
/**
 * Live g2a StreamFactory — setMandate(recipient,token,ticket,period,laps,t0) + createStreamFor,
 * plus the live reads a recurring-link snippet needs: `feeBps()`, `minFee()`, `predict(...)` and the
 * public `mandate(payer,recipient,token)` getter.
 *
 * Re-probed 2026-11-13 against the CURRENT new-line rail 0x3882A049… (Base) — a rebuild whose runtime
 * is byte-identical to the earlier 0x8f26d7a5… copy (keccak 0xa4798afc…3a6761, both 16643 B). All five
 * selectors scanned PRESENT and the views eth_call-read live (`minFee()` → 0). `predict` here is the
 * deployed 6-arg uint64-end form (`0xce580c87`), matching products/g2a-streams/src/StreamFactory.sol:322.
 */
export const streamFactoryLiveAbi = [
    {
        type: "function",
        name: "feeBps",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint16" }],
    },
    {
        type: "function",
        name: "minFee",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "setMandate",
        stateMutability: "nonpayable",
        inputs: [
            { name: "recipient", type: "address" },
            { name: "token", type: "address" },
            { name: "ticket", type: "uint256" },
            { name: "period", type: "uint64" },
            { name: "laps", type: "uint32" },
            { name: "t0", type: "uint64" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "createStreamFor",
        stateMutability: "nonpayable",
        inputs: [
            { name: "payer", type: "address" },
            { name: "recipient", type: "address" },
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "start", type: "uint64" },
            { name: "end", type: "uint64" },
        ],
        outputs: [{ type: "address" }],
    },
    {
        type: "function",
        name: "predict",
        stateMutability: "view",
        inputs: [
            { name: "payer", type: "address" },
            { name: "recipient", type: "address" },
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "start", type: "uint64" },
            { name: "end", type: "uint64" },
        ],
        outputs: [{ type: "address" }],
    },
    {
        type: "function",
        name: "mandate",
        stateMutability: "view",
        inputs: [
            { name: "", type: "address" },
            { name: "", type: "address" },
            { name: "", type: "address" },
        ],
        outputs: [
            { name: "token", type: "address" },
            { name: "ticket", type: "uint256" },
            { name: "period", type: "uint64" },
            { name: "lastEnd", type: "uint64" },
            { name: "laps", type: "uint32" },
            { name: "fired", type: "uint32" },
            { name: "active", type: "bool" },
        ],
    },
    {
        type: "event",
        name: "MandateSet",
        inputs: [
            { name: "payer", type: "address", indexed: true },
            { name: "recipient", type: "address", indexed: true },
            { name: "token", type: "address", indexed: false },
            { name: "ticket", type: "uint256", indexed: false },
            { name: "period", type: "uint64", indexed: false },
            { name: "laps", type: "uint32", indexed: false },
        ],
    },
];
/** RequestRegistry — products/p2-forwarder/src/RequestRegistry.sol (f1a payment links). */
export const requestRegistryAbi = [
    {
        type: "function",
        name: "request",
        stateMutability: "nonpayable",
        inputs: [
            { name: "destination", type: "address" },
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "memo", type: "bytes32" },
        ],
        outputs: [
            { name: "id", type: "uint256" },
            { name: "depositAddr", type: "address" },
        ],
    },
    {
        type: "function",
        name: "predictDepositFor",
        stateMutability: "view",
        inputs: [{ name: "destination", type: "address" }],
        outputs: [{ type: "address" }],
    },
    {
        type: "function",
        name: "request_",
        stateMutability: "view",
        inputs: [{ name: "id", type: "uint256" }],
        outputs: [
            {
                name: "r",
                type: "tuple",
                components: [
                    { name: "merchant", type: "address" },
                    { name: "payer", type: "address" },
                    { name: "destination", type: "address" },
                    { name: "token", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "memo", type: "bytes32" },
                    { name: "depositAddr", type: "address" },
                    { name: "createdAt", type: "uint64" },
                    { name: "settled", type: "bool" },
                    { name: "settledAt", type: "uint64" },
                ],
            },
        ],
    },
    { type: "function", name: "settle", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
    { type: "function", name: "nextId", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
    { type: "function", name: "p2Registry", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
];
/** p3 Router — products/p3-router/src/Router.sol. Live swap selector 0xd3bd0b52. */
export const swapRouterAbi = [
    {
        type: "function",
        name: "swapExactTokensForTokens",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "p",
                type: "tuple",
                components: [
                    { name: "amountIn", type: "uint256" },
                    { name: "amountOutMin", type: "uint256" },
                    {
                        name: "hops",
                        type: "tuple[]",
                        components: [
                            { name: "venue", type: "uint8" },
                            { name: "tokenIn", type: "address" },
                            { name: "tokenOut", type: "address" },
                            { name: "feeTier", type: "uint24" },
                            { name: "stable", type: "bool" },
                            { name: "venueRouter", type: "address" },
                            { name: "factory", type: "address" },
                        ],
                    },
                    { name: "recipient", type: "address" },
                    { name: "deadline", type: "uint256" },
                ],
            },
        ],
        outputs: [{ name: "amountOut", type: "uint256" }],
    },
    { type: "function", name: "previewFee", stateMutability: "view", inputs: [{ name: "amountIn", type: "uint256" }], outputs: [{ type: "uint256" }] },
    { type: "function", name: "feeBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
    { type: "function", name: "treasury", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
];
/** DustSweeper — products/f1c-duster/src/DustSweeper.sol (f1-c dust sweep). */
export const sweepAbi = [
    {
        type: "function",
        name: "sweep",
        stateMutability: "nonpayable",
        inputs: [
            { name: "tokens", type: "address[]" },
            {
                name: "hops",
                type: "tuple[]",
                components: [
                    { name: "venue", type: "uint8" },
                    { name: "tokenIn", type: "address" },
                    { name: "tokenOut", type: "address" },
                    { name: "feeTier", type: "uint24" },
                    { name: "venueRouter", type: "address" },
                ],
            },
            { name: "minOut", type: "uint256[]" },
        ],
        outputs: [{ name: "totalOut", type: "uint256" }],
    },
];
/** x402Facilitator — products/x402/src/x402Facilitator.sol (402 verify). */
export const x402FacilitatorAbi = [
    {
        type: "function",
        name: "verify",
        stateMutability: "view",
        inputs: [
            { name: "paymentId", type: "bytes32" },
            { name: "to", type: "address" },
            { name: "token", type: "address" },
            { name: "minAmount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
    },
    {
        type: "function",
        name: "settlement",
        stateMutability: "view",
        inputs: [{ name: "paymentId", type: "bytes32" }],
        outputs: [
            { name: "to", type: "address" },
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "at", type: "uint64" },
        ],
    },
    {
        type: "function",
        name: "paid",
        stateMutability: "view",
        inputs: [{ name: "paymentId", type: "bytes32" }],
        outputs: [
            { name: "amount", type: "uint256" },
            { name: "at", type: "uint64" },
        ],
    },
    {
        // NB: facilitator's markPaid takes (bytes32,address,address,uint256) — the SettlementRegistry's
        // is (bytes32,uint256). A builder that encodes one against the other's `to` reverts on decode
        // (or, worse, writes the wrong record). Kept in SEPARATE abi constants so the two cannot be
        // confused; both selectors are pinned in test/buildCallData.test.ts.
        type: "function",
        name: "markPaid",
        stateMutability: "nonpayable",
        inputs: [
            { name: "paymentId", type: "bytes32" },
            { name: "to", type: "address" },
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
    },
];
/** SettlementRegistry (lane 10) — ISettlementRegistry.sol, read side + its OWN writer shape. */
export const settlementRegistryAbi = [
    {
        type: "function",
        name: "paid",
        stateMutability: "view",
        inputs: [{ name: "paymentId", type: "bytes32" }],
        outputs: [
            { name: "amount", type: "uint256" },
            { name: "at", type: "uint64" },
        ],
    },
    { type: "function", name: "isWriter", stateMutability: "view", inputs: [{ name: "who", type: "address" }], outputs: [{ type: "bool" }] },
    {
        // (bytes32,uint256) — NOT the x402Facilitator's (bytes32,address,address,uint256).
        type: "function",
        name: "markPaid",
        stateMutability: "nonpayable",
        inputs: [
            { name: "paymentId", type: "bytes32" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
    },
];
/**
 * Functions gated by a writer allow-list (a bare call from a non-writer reverts `NotWriter`).
 * An integrator reading this map knows WHICH verbs need a keeper key vs a user key. `supports()`
 * cannot see gating (it only proves code+selector exist), so the label is carried here.
 */
export const WRITER_GATED = {
    "x402Facilitator.markPaid": { gate: "onlyWriter", role: "keeper" },
    "settlementRegistry.markPaid": { gate: "onlyWriter", role: "keeper" },
};
/** FleetExecutor — products/fleet-executor/src/FleetExecutor.sol (EIP-712 batch + ERC-7821). */
export const fleetExecutorAbi = [
    {
        type: "function",
        name: "execute",
        stateMutability: "payable",
        inputs: [
            {
                name: "calls",
                type: "tuple[]",
                components: [
                    { name: "target", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "data", type: "bytes" },
                ],
            },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
            { name: "sig", type: "bytes" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "executeSelf",
        stateMutability: "payable",
        inputs: [
            {
                name: "calls",
                type: "tuple[]",
                components: [
                    { name: "target", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "data", type: "bytes" },
                ],
            },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "digest",
        stateMutability: "view",
        inputs: [
            {
                name: "calls",
                type: "tuple[]",
                components: [
                    { name: "target", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "data", type: "bytes" },
                ],
            },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
        outputs: [{ type: "bytes32" }],
    },
];
export const abis = {
    paymentRail: paymentRailAbi,
    escrowRail: escrowRailAbi,
    escrow: escrowAbi,
    escrowFactoryLive: escrowFactoryLiveAbi,
    streamRail: streamRailAbi,
    streamFactoryLive: streamFactoryLiveAbi,
    requestRegistry: requestRegistryAbi,
    swapRouter: swapRouterAbi,
    sweep: sweepAbi,
    x402Facilitator: x402FacilitatorAbi,
    settlementRegistry: settlementRegistryAbi,
    fleetExecutor: fleetExecutorAbi,
};
//# sourceMappingURL=abi.js.map