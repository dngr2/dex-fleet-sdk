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
export declare const paymentRailAbi: readonly [{
    readonly type: "function";
    readonly name: "feeBps";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint16";
    }];
}, {
    readonly type: "function";
    readonly name: "minFee";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "quote";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "fee";
        readonly type: "uint256";
    }, {
        readonly name: "out";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "pay";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "memo";
        readonly type: "bytes32";
    }, {
        readonly name: "referrer";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "event";
    readonly name: "Paid";
    readonly inputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "payer";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "token";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "fee";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "memo";
        readonly type: "bytes32";
        readonly indexed: false;
    }, {
        readonly name: "referrer";
        readonly type: "address";
        readonly indexed: false;
    }];
}];
/**
 * The DEPLOYED minFee shape. The frozen interface names `minFee(address token)`; what actually shipped
 * on the new line is a no-arg `minFee()` (`0x24ec7590`, live on the p2 registry, g2a streamRail and g2b
 * escrowRail — all return 0 as of 2026-11-13). Kept as its own fragment so `paymentRailAbi` stays a
 * faithful mirror of the frozen interface while a reader can still call the deployed getter.
 */
export declare const paymentRailLiveAbi: readonly [{
    readonly type: "function";
    readonly name: "feeBps";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint16";
    }];
}, {
    readonly type: "function";
    readonly name: "minFee";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}];
/** IEscrowRail — products/rails/src/IEscrowRail.sol (frozen), factory side. */
export declare const escrowRailAbi: readonly [{
    readonly type: "function";
    readonly name: "createFor";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "d";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "counterparty";
            readonly type: "address";
        }, {
            readonly name: "arbiter";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "hash";
            readonly type: "bytes32";
        }, {
            readonly name: "timeout";
            readonly type: "uint64";
        }, {
            readonly name: "releaseGrace";
            readonly type: "uint64";
        }, {
            readonly name: "hook";
            readonly type: "address";
        }];
    }, {
        readonly name: "referrer";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "escrow";
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "createForPayer";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "d";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "counterparty";
            readonly type: "address";
        }, {
            readonly name: "arbiter";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "hash";
            readonly type: "bytes32";
        }, {
            readonly name: "timeout";
            readonly type: "uint64";
        }, {
            readonly name: "releaseGrace";
            readonly type: "uint64";
        }, {
            readonly name: "hook";
            readonly type: "address";
        }];
    }, {
        readonly name: "payer";
        readonly type: "address";
    }, {
        readonly name: "sig";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [{
        readonly name: "escrow";
        readonly type: "address";
    }];
}];
/** The escrow CHILD (live g2b Escrow + frozen IEscrowRail's escrow-side reads). */
export declare const escrowAbi: readonly [{
    readonly type: "function";
    readonly name: "release";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "preimage";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "refund";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "arbiterRelease";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "arbiterRefund";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "outcome";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint8";
    }];
}, {
    readonly type: "function";
    readonly name: "sweepExcess";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "settled";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly type: "event";
    readonly name: "Released";
    readonly inputs: readonly [{
        readonly name: "preimage";
        readonly type: "bytes32";
        readonly indexed: false;
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amountIn";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "fee";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "out";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "by";
        readonly type: "address";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "Refunded";
    readonly inputs: readonly [{
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "by";
        readonly type: "address";
        readonly indexed: false;
    }];
}];
/** Live g2b EscrowFactory.createFor — 6-field Deal (no referrer/grace/hook). */
export declare const escrowFactoryLiveAbi: readonly [{
    readonly type: "function";
    readonly name: "create";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "counterparty";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "hash";
        readonly type: "bytes32";
    }, {
        readonly name: "timeout";
        readonly type: "uint64";
    }];
    readonly outputs: readonly [{
        readonly name: "escrow";
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "createFor";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "d";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "counterparty";
            readonly type: "address";
        }, {
            readonly name: "arbiter";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "hash";
            readonly type: "bytes32";
        }, {
            readonly name: "timeout";
            readonly type: "uint64";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "escrow";
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "predict";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "payer";
        readonly type: "address";
    }, {
        readonly name: "d";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "counterparty";
            readonly type: "address";
        }, {
            readonly name: "arbiter";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "hash";
            readonly type: "bytes32";
        }, {
            readonly name: "timeout";
            readonly type: "uint64";
        }];
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "feeBps";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint16";
    }];
}];
/** IStreamRail — products/rails/src/IStreamRail.sol (frozen), signed-mandate portal. */
export declare const streamRailAbi: readonly [{
    readonly type: "function";
    readonly name: "setMandateFor";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "payer";
        readonly type: "address";
    }, {
        readonly name: "recipient";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "ticket";
        readonly type: "uint256";
    }, {
        readonly name: "period";
        readonly type: "uint64";
    }, {
        readonly name: "laps";
        readonly type: "uint32";
    }, {
        readonly name: "referrer";
        readonly type: "address";
    }, {
        readonly name: "sig";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [{
        readonly name: "mandateId";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "function";
    readonly name: "executeLap";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "mandateId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "vault";
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "dueLaps";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "fromMandateId";
        readonly type: "bytes32";
    }, {
        readonly name: "count";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "bytes32[]";
    }];
}, {
    readonly type: "function";
    readonly name: "mandatesOf";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "payer";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "bytes32[]";
    }];
}, {
    readonly type: "function";
    readonly name: "revokeMandate";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "mandateId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "event";
    readonly name: "MandateSet";
    readonly inputs: readonly [{
        readonly name: "mandateId";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "payer";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "recipient";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "token";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "ticket";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "period";
        readonly type: "uint64";
        readonly indexed: false;
    }, {
        readonly name: "laps";
        readonly type: "uint32";
        readonly indexed: false;
    }, {
        readonly name: "referrer";
        readonly type: "address";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "LapExecuted";
    readonly inputs: readonly [{
        readonly name: "mandateId";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "vault";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "lapIndex";
        readonly type: "uint32";
        readonly indexed: false;
    }, {
        readonly name: "start";
        readonly type: "uint64";
        readonly indexed: false;
    }, {
        readonly name: "end";
        readonly type: "uint64";
        readonly indexed: false;
    }];
}];
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
export declare const streamFactoryLiveAbi: readonly [{
    readonly type: "function";
    readonly name: "feeBps";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint16";
    }];
}, {
    readonly type: "function";
    readonly name: "minFee";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "setMandate";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "recipient";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "ticket";
        readonly type: "uint256";
    }, {
        readonly name: "period";
        readonly type: "uint64";
    }, {
        readonly name: "laps";
        readonly type: "uint32";
    }, {
        readonly name: "t0";
        readonly type: "uint64";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "createStreamFor";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "payer";
        readonly type: "address";
    }, {
        readonly name: "recipient";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "start";
        readonly type: "uint64";
    }, {
        readonly name: "end";
        readonly type: "uint64";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "predict";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "payer";
        readonly type: "address";
    }, {
        readonly name: "recipient";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "start";
        readonly type: "uint64";
    }, {
        readonly name: "end";
        readonly type: "uint64";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "mandate";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }, {
        readonly name: "";
        readonly type: "address";
    }, {
        readonly name: "";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "ticket";
        readonly type: "uint256";
    }, {
        readonly name: "period";
        readonly type: "uint64";
    }, {
        readonly name: "lastEnd";
        readonly type: "uint64";
    }, {
        readonly name: "laps";
        readonly type: "uint32";
    }, {
        readonly name: "fired";
        readonly type: "uint32";
    }, {
        readonly name: "active";
        readonly type: "bool";
    }];
}, {
    readonly type: "event";
    readonly name: "MandateSet";
    readonly inputs: readonly [{
        readonly name: "payer";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "recipient";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "token";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "ticket";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "period";
        readonly type: "uint64";
        readonly indexed: false;
    }, {
        readonly name: "laps";
        readonly type: "uint32";
        readonly indexed: false;
    }];
}];
/** RequestRegistry — products/p2-forwarder/src/RequestRegistry.sol (f1a payment links). */
export declare const requestRegistryAbi: readonly [{
    readonly type: "function";
    readonly name: "request";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "destination";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "memo";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "id";
        readonly type: "uint256";
    }, {
        readonly name: "depositAddr";
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "predictDepositFor";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "destination";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "request_";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "r";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "merchant";
            readonly type: "address";
        }, {
            readonly name: "payer";
            readonly type: "address";
        }, {
            readonly name: "destination";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "memo";
            readonly type: "bytes32";
        }, {
            readonly name: "depositAddr";
            readonly type: "address";
        }, {
            readonly name: "createdAt";
            readonly type: "uint64";
        }, {
            readonly name: "settled";
            readonly type: "bool";
        }, {
            readonly name: "settledAt";
            readonly type: "uint64";
        }];
    }];
}, {
    readonly type: "function";
    readonly name: "settle";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "nextId";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "p2Registry";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}];
/** p3 Router — products/p3-router/src/Router.sol. Live swap selector 0xd3bd0b52. */
export declare const swapRouterAbi: readonly [{
    readonly type: "function";
    readonly name: "swapExactTokensForTokens";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "p";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "amountIn";
            readonly type: "uint256";
        }, {
            readonly name: "amountOutMin";
            readonly type: "uint256";
        }, {
            readonly name: "hops";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "venue";
                readonly type: "uint8";
            }, {
                readonly name: "tokenIn";
                readonly type: "address";
            }, {
                readonly name: "tokenOut";
                readonly type: "address";
            }, {
                readonly name: "feeTier";
                readonly type: "uint24";
            }, {
                readonly name: "stable";
                readonly type: "bool";
            }, {
                readonly name: "venueRouter";
                readonly type: "address";
            }, {
                readonly name: "factory";
                readonly type: "address";
            }];
        }, {
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly name: "deadline";
            readonly type: "uint256";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "previewFee";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "amountIn";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "feeBps";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "treasury";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}];
/** DustSweeper — products/f1c-duster/src/DustSweeper.sol (f1-c dust sweep). */
export declare const sweepAbi: readonly [{
    readonly type: "function";
    readonly name: "sweep";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "tokens";
        readonly type: "address[]";
    }, {
        readonly name: "hops";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "venue";
            readonly type: "uint8";
        }, {
            readonly name: "tokenIn";
            readonly type: "address";
        }, {
            readonly name: "tokenOut";
            readonly type: "address";
        }, {
            readonly name: "feeTier";
            readonly type: "uint24";
        }, {
            readonly name: "venueRouter";
            readonly type: "address";
        }];
    }, {
        readonly name: "minOut";
        readonly type: "uint256[]";
    }];
    readonly outputs: readonly [{
        readonly name: "totalOut";
        readonly type: "uint256";
    }];
}];
/** x402Facilitator — products/x402/src/x402Facilitator.sol (402 verify). */
export declare const x402FacilitatorAbi: readonly [{
    readonly type: "function";
    readonly name: "verify";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "minAmount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "settlement";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "at";
        readonly type: "uint64";
    }];
}, {
    readonly type: "function";
    readonly name: "paid";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "at";
        readonly type: "uint64";
    }];
}, {
    readonly type: "function";
    readonly name: "markPaid";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}];
/** SettlementRegistry (lane 10) — ISettlementRegistry.sol, read side + its OWN writer shape. */
export declare const settlementRegistryAbi: readonly [{
    readonly type: "function";
    readonly name: "paid";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "at";
        readonly type: "uint64";
    }];
}, {
    readonly type: "function";
    readonly name: "isWriter";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "who";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "markPaid";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}];
/**
 * Functions gated by a writer allow-list (a bare call from a non-writer reverts `NotWriter`).
 * An integrator reading this map knows WHICH verbs need a keeper key vs a user key. `supports()`
 * cannot see gating (it only proves code+selector exist), so the label is carried here.
 */
export declare const WRITER_GATED: {
    readonly "x402Facilitator.markPaid": {
        readonly gate: "onlyWriter";
        readonly role: "keeper";
    };
    readonly "settlementRegistry.markPaid": {
        readonly gate: "onlyWriter";
        readonly role: "keeper";
    };
};
/** FleetExecutor — products/fleet-executor/src/FleetExecutor.sol (EIP-712 batch + ERC-7821). */
export declare const fleetExecutorAbi: readonly [{
    readonly type: "function";
    readonly name: "execute";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "calls";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "target";
            readonly type: "address";
        }, {
            readonly name: "value";
            readonly type: "uint256";
        }, {
            readonly name: "data";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "nonce";
        readonly type: "uint256";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }, {
        readonly name: "sig";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "executeSelf";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "calls";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "target";
            readonly type: "address";
        }, {
            readonly name: "value";
            readonly type: "uint256";
        }, {
            readonly name: "data";
            readonly type: "bytes";
        }];
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "digest";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "calls";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "target";
            readonly type: "address";
        }, {
            readonly name: "value";
            readonly type: "uint256";
        }, {
            readonly name: "data";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "nonce";
        readonly type: "uint256";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "bytes32";
    }];
}];
export declare const abis: {
    readonly paymentRail: readonly [{
        readonly type: "function";
        readonly name: "feeBps";
        readonly stateMutability: "view";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "uint16";
        }];
    }, {
        readonly type: "function";
        readonly name: "minFee";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "token";
            readonly type: "address";
        }];
        readonly outputs: readonly [{
            readonly type: "uint256";
        }];
    }, {
        readonly type: "function";
        readonly name: "quote";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly outputs: readonly [{
            readonly name: "fee";
            readonly type: "uint256";
        }, {
            readonly name: "out";
            readonly type: "uint256";
        }];
    }, {
        readonly type: "function";
        readonly name: "pay";
        readonly stateMutability: "payable";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "memo";
            readonly type: "bytes32";
        }, {
            readonly name: "referrer";
            readonly type: "address";
        }];
        readonly outputs: readonly [{
            readonly name: "paymentId";
            readonly type: "bytes32";
        }];
    }, {
        readonly type: "event";
        readonly name: "Paid";
        readonly inputs: readonly [{
            readonly name: "paymentId";
            readonly type: "bytes32";
            readonly indexed: true;
        }, {
            readonly name: "payer";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "to";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "token";
            readonly type: "address";
            readonly indexed: false;
        }, {
            readonly name: "amount";
            readonly type: "uint256";
            readonly indexed: false;
        }, {
            readonly name: "fee";
            readonly type: "uint256";
            readonly indexed: false;
        }, {
            readonly name: "memo";
            readonly type: "bytes32";
            readonly indexed: false;
        }, {
            readonly name: "referrer";
            readonly type: "address";
            readonly indexed: false;
        }];
    }];
    readonly escrowRail: readonly [{
        readonly type: "function";
        readonly name: "createFor";
        readonly stateMutability: "payable";
        readonly inputs: readonly [{
            readonly name: "d";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "counterparty";
                readonly type: "address";
            }, {
                readonly name: "arbiter";
                readonly type: "address";
            }, {
                readonly name: "token";
                readonly type: "address";
            }, {
                readonly name: "amount";
                readonly type: "uint256";
            }, {
                readonly name: "hash";
                readonly type: "bytes32";
            }, {
                readonly name: "timeout";
                readonly type: "uint64";
            }, {
                readonly name: "releaseGrace";
                readonly type: "uint64";
            }, {
                readonly name: "hook";
                readonly type: "address";
            }];
        }, {
            readonly name: "referrer";
            readonly type: "address";
        }];
        readonly outputs: readonly [{
            readonly name: "escrow";
            readonly type: "address";
        }];
    }, {
        readonly type: "function";
        readonly name: "createForPayer";
        readonly stateMutability: "payable";
        readonly inputs: readonly [{
            readonly name: "d";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "counterparty";
                readonly type: "address";
            }, {
                readonly name: "arbiter";
                readonly type: "address";
            }, {
                readonly name: "token";
                readonly type: "address";
            }, {
                readonly name: "amount";
                readonly type: "uint256";
            }, {
                readonly name: "hash";
                readonly type: "bytes32";
            }, {
                readonly name: "timeout";
                readonly type: "uint64";
            }, {
                readonly name: "releaseGrace";
                readonly type: "uint64";
            }, {
                readonly name: "hook";
                readonly type: "address";
            }];
        }, {
            readonly name: "payer";
            readonly type: "address";
        }, {
            readonly name: "sig";
            readonly type: "bytes";
        }];
        readonly outputs: readonly [{
            readonly name: "escrow";
            readonly type: "address";
        }];
    }];
    readonly escrow: readonly [{
        readonly type: "function";
        readonly name: "release";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "preimage";
            readonly type: "bytes32";
        }];
        readonly outputs: readonly [];
    }, {
        readonly type: "function";
        readonly name: "refund";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
    }, {
        readonly type: "function";
        readonly name: "arbiterRelease";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
    }, {
        readonly type: "function";
        readonly name: "arbiterRefund";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
    }, {
        readonly type: "function";
        readonly name: "outcome";
        readonly stateMutability: "view";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "uint8";
        }];
    }, {
        readonly type: "function";
        readonly name: "sweepExcess";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "uint256";
        }];
    }, {
        readonly type: "function";
        readonly name: "settled";
        readonly stateMutability: "view";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "bool";
        }];
    }, {
        readonly type: "event";
        readonly name: "Released";
        readonly inputs: readonly [{
            readonly name: "preimage";
            readonly type: "bytes32";
            readonly indexed: false;
        }, {
            readonly name: "to";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "amountIn";
            readonly type: "uint256";
            readonly indexed: false;
        }, {
            readonly name: "fee";
            readonly type: "uint256";
            readonly indexed: false;
        }, {
            readonly name: "out";
            readonly type: "uint256";
            readonly indexed: false;
        }, {
            readonly name: "by";
            readonly type: "address";
            readonly indexed: false;
        }];
    }, {
        readonly type: "event";
        readonly name: "Refunded";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "amount";
            readonly type: "uint256";
            readonly indexed: false;
        }, {
            readonly name: "by";
            readonly type: "address";
            readonly indexed: false;
        }];
    }];
    readonly escrowFactoryLive: readonly [{
        readonly type: "function";
        readonly name: "create";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "counterparty";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "hash";
            readonly type: "bytes32";
        }, {
            readonly name: "timeout";
            readonly type: "uint64";
        }];
        readonly outputs: readonly [{
            readonly name: "escrow";
            readonly type: "address";
        }];
    }, {
        readonly type: "function";
        readonly name: "createFor";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "d";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "counterparty";
                readonly type: "address";
            }, {
                readonly name: "arbiter";
                readonly type: "address";
            }, {
                readonly name: "token";
                readonly type: "address";
            }, {
                readonly name: "amount";
                readonly type: "uint256";
            }, {
                readonly name: "hash";
                readonly type: "bytes32";
            }, {
                readonly name: "timeout";
                readonly type: "uint64";
            }];
        }];
        readonly outputs: readonly [{
            readonly name: "escrow";
            readonly type: "address";
        }];
    }, {
        readonly type: "function";
        readonly name: "predict";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "payer";
            readonly type: "address";
        }, {
            readonly name: "d";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "counterparty";
                readonly type: "address";
            }, {
                readonly name: "arbiter";
                readonly type: "address";
            }, {
                readonly name: "token";
                readonly type: "address";
            }, {
                readonly name: "amount";
                readonly type: "uint256";
            }, {
                readonly name: "hash";
                readonly type: "bytes32";
            }, {
                readonly name: "timeout";
                readonly type: "uint64";
            }];
        }];
        readonly outputs: readonly [{
            readonly type: "address";
        }];
    }, {
        readonly type: "function";
        readonly name: "feeBps";
        readonly stateMutability: "view";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "uint16";
        }];
    }];
    readonly streamRail: readonly [{
        readonly type: "function";
        readonly name: "setMandateFor";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "payer";
            readonly type: "address";
        }, {
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "ticket";
            readonly type: "uint256";
        }, {
            readonly name: "period";
            readonly type: "uint64";
        }, {
            readonly name: "laps";
            readonly type: "uint32";
        }, {
            readonly name: "referrer";
            readonly type: "address";
        }, {
            readonly name: "sig";
            readonly type: "bytes";
        }];
        readonly outputs: readonly [{
            readonly name: "mandateId";
            readonly type: "bytes32";
        }];
    }, {
        readonly type: "function";
        readonly name: "executeLap";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "mandateId";
            readonly type: "bytes32";
        }];
        readonly outputs: readonly [{
            readonly name: "vault";
            readonly type: "address";
        }];
    }, {
        readonly type: "function";
        readonly name: "dueLaps";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "fromMandateId";
            readonly type: "bytes32";
        }, {
            readonly name: "count";
            readonly type: "uint256";
        }];
        readonly outputs: readonly [{
            readonly type: "bytes32[]";
        }];
    }, {
        readonly type: "function";
        readonly name: "mandatesOf";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "payer";
            readonly type: "address";
        }];
        readonly outputs: readonly [{
            readonly type: "bytes32[]";
        }];
    }, {
        readonly type: "function";
        readonly name: "revokeMandate";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "mandateId";
            readonly type: "bytes32";
        }];
        readonly outputs: readonly [];
    }, {
        readonly type: "event";
        readonly name: "MandateSet";
        readonly inputs: readonly [{
            readonly name: "mandateId";
            readonly type: "bytes32";
            readonly indexed: true;
        }, {
            readonly name: "payer";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "recipient";
            readonly type: "address";
            readonly indexed: false;
        }, {
            readonly name: "token";
            readonly type: "address";
            readonly indexed: false;
        }, {
            readonly name: "ticket";
            readonly type: "uint256";
            readonly indexed: false;
        }, {
            readonly name: "period";
            readonly type: "uint64";
            readonly indexed: false;
        }, {
            readonly name: "laps";
            readonly type: "uint32";
            readonly indexed: false;
        }, {
            readonly name: "referrer";
            readonly type: "address";
            readonly indexed: false;
        }];
    }, {
        readonly type: "event";
        readonly name: "LapExecuted";
        readonly inputs: readonly [{
            readonly name: "mandateId";
            readonly type: "bytes32";
            readonly indexed: true;
        }, {
            readonly name: "vault";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "lapIndex";
            readonly type: "uint32";
            readonly indexed: false;
        }, {
            readonly name: "start";
            readonly type: "uint64";
            readonly indexed: false;
        }, {
            readonly name: "end";
            readonly type: "uint64";
            readonly indexed: false;
        }];
    }];
    readonly streamFactoryLive: readonly [{
        readonly type: "function";
        readonly name: "feeBps";
        readonly stateMutability: "view";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "uint16";
        }];
    }, {
        readonly type: "function";
        readonly name: "minFee";
        readonly stateMutability: "view";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "uint256";
        }];
    }, {
        readonly type: "function";
        readonly name: "setMandate";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "ticket";
            readonly type: "uint256";
        }, {
            readonly name: "period";
            readonly type: "uint64";
        }, {
            readonly name: "laps";
            readonly type: "uint32";
        }, {
            readonly name: "t0";
            readonly type: "uint64";
        }];
        readonly outputs: readonly [];
    }, {
        readonly type: "function";
        readonly name: "createStreamFor";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "payer";
            readonly type: "address";
        }, {
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "start";
            readonly type: "uint64";
        }, {
            readonly name: "end";
            readonly type: "uint64";
        }];
        readonly outputs: readonly [{
            readonly type: "address";
        }];
    }, {
        readonly type: "function";
        readonly name: "predict";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "payer";
            readonly type: "address";
        }, {
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "start";
            readonly type: "uint64";
        }, {
            readonly name: "end";
            readonly type: "uint64";
        }];
        readonly outputs: readonly [{
            readonly type: "address";
        }];
    }, {
        readonly type: "function";
        readonly name: "mandate";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "";
            readonly type: "address";
        }, {
            readonly name: "";
            readonly type: "address";
        }, {
            readonly name: "";
            readonly type: "address";
        }];
        readonly outputs: readonly [{
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "ticket";
            readonly type: "uint256";
        }, {
            readonly name: "period";
            readonly type: "uint64";
        }, {
            readonly name: "lastEnd";
            readonly type: "uint64";
        }, {
            readonly name: "laps";
            readonly type: "uint32";
        }, {
            readonly name: "fired";
            readonly type: "uint32";
        }, {
            readonly name: "active";
            readonly type: "bool";
        }];
    }, {
        readonly type: "event";
        readonly name: "MandateSet";
        readonly inputs: readonly [{
            readonly name: "payer";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "recipient";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "token";
            readonly type: "address";
            readonly indexed: false;
        }, {
            readonly name: "ticket";
            readonly type: "uint256";
            readonly indexed: false;
        }, {
            readonly name: "period";
            readonly type: "uint64";
            readonly indexed: false;
        }, {
            readonly name: "laps";
            readonly type: "uint32";
            readonly indexed: false;
        }];
    }];
    readonly requestRegistry: readonly [{
        readonly type: "function";
        readonly name: "request";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "destination";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "memo";
            readonly type: "bytes32";
        }];
        readonly outputs: readonly [{
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly name: "depositAddr";
            readonly type: "address";
        }];
    }, {
        readonly type: "function";
        readonly name: "predictDepositFor";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "destination";
            readonly type: "address";
        }];
        readonly outputs: readonly [{
            readonly type: "address";
        }];
    }, {
        readonly type: "function";
        readonly name: "request_";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly outputs: readonly [{
            readonly name: "r";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "merchant";
                readonly type: "address";
            }, {
                readonly name: "payer";
                readonly type: "address";
            }, {
                readonly name: "destination";
                readonly type: "address";
            }, {
                readonly name: "token";
                readonly type: "address";
            }, {
                readonly name: "amount";
                readonly type: "uint256";
            }, {
                readonly name: "memo";
                readonly type: "bytes32";
            }, {
                readonly name: "depositAddr";
                readonly type: "address";
            }, {
                readonly name: "createdAt";
                readonly type: "uint64";
            }, {
                readonly name: "settled";
                readonly type: "bool";
            }, {
                readonly name: "settledAt";
                readonly type: "uint64";
            }];
        }];
    }, {
        readonly type: "function";
        readonly name: "settle";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly outputs: readonly [];
    }, {
        readonly type: "function";
        readonly name: "nextId";
        readonly stateMutability: "view";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "uint256";
        }];
    }, {
        readonly type: "function";
        readonly name: "p2Registry";
        readonly stateMutability: "view";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "address";
        }];
    }];
    readonly swapRouter: readonly [{
        readonly type: "function";
        readonly name: "swapExactTokensForTokens";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "p";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "amountIn";
                readonly type: "uint256";
            }, {
                readonly name: "amountOutMin";
                readonly type: "uint256";
            }, {
                readonly name: "hops";
                readonly type: "tuple[]";
                readonly components: readonly [{
                    readonly name: "venue";
                    readonly type: "uint8";
                }, {
                    readonly name: "tokenIn";
                    readonly type: "address";
                }, {
                    readonly name: "tokenOut";
                    readonly type: "address";
                }, {
                    readonly name: "feeTier";
                    readonly type: "uint24";
                }, {
                    readonly name: "stable";
                    readonly type: "bool";
                }, {
                    readonly name: "venueRouter";
                    readonly type: "address";
                }, {
                    readonly name: "factory";
                    readonly type: "address";
                }];
            }, {
                readonly name: "recipient";
                readonly type: "address";
            }, {
                readonly name: "deadline";
                readonly type: "uint256";
            }];
        }];
        readonly outputs: readonly [{
            readonly name: "amountOut";
            readonly type: "uint256";
        }];
    }, {
        readonly type: "function";
        readonly name: "previewFee";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "amountIn";
            readonly type: "uint256";
        }];
        readonly outputs: readonly [{
            readonly type: "uint256";
        }];
    }, {
        readonly type: "function";
        readonly name: "feeBps";
        readonly stateMutability: "view";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "uint256";
        }];
    }, {
        readonly type: "function";
        readonly name: "treasury";
        readonly stateMutability: "view";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "address";
        }];
    }];
    readonly sweep: readonly [{
        readonly type: "function";
        readonly name: "sweep";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "tokens";
            readonly type: "address[]";
        }, {
            readonly name: "hops";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "venue";
                readonly type: "uint8";
            }, {
                readonly name: "tokenIn";
                readonly type: "address";
            }, {
                readonly name: "tokenOut";
                readonly type: "address";
            }, {
                readonly name: "feeTier";
                readonly type: "uint24";
            }, {
                readonly name: "venueRouter";
                readonly type: "address";
            }];
        }, {
            readonly name: "minOut";
            readonly type: "uint256[]";
        }];
        readonly outputs: readonly [{
            readonly name: "totalOut";
            readonly type: "uint256";
        }];
    }];
    readonly x402Facilitator: readonly [{
        readonly type: "function";
        readonly name: "verify";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "paymentId";
            readonly type: "bytes32";
        }, {
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "minAmount";
            readonly type: "uint256";
        }];
        readonly outputs: readonly [{
            readonly type: "bool";
        }];
    }, {
        readonly type: "function";
        readonly name: "settlement";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "paymentId";
            readonly type: "bytes32";
        }];
        readonly outputs: readonly [{
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "at";
            readonly type: "uint64";
        }];
    }, {
        readonly type: "function";
        readonly name: "paid";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "paymentId";
            readonly type: "bytes32";
        }];
        readonly outputs: readonly [{
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "at";
            readonly type: "uint64";
        }];
    }, {
        readonly type: "function";
        readonly name: "markPaid";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "paymentId";
            readonly type: "bytes32";
        }, {
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly outputs: readonly [];
    }];
    readonly settlementRegistry: readonly [{
        readonly type: "function";
        readonly name: "paid";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "paymentId";
            readonly type: "bytes32";
        }];
        readonly outputs: readonly [{
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "at";
            readonly type: "uint64";
        }];
    }, {
        readonly type: "function";
        readonly name: "isWriter";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "who";
            readonly type: "address";
        }];
        readonly outputs: readonly [{
            readonly type: "bool";
        }];
    }, {
        readonly type: "function";
        readonly name: "markPaid";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly name: "paymentId";
            readonly type: "bytes32";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly outputs: readonly [];
    }];
    readonly fleetExecutor: readonly [{
        readonly type: "function";
        readonly name: "execute";
        readonly stateMutability: "payable";
        readonly inputs: readonly [{
            readonly name: "calls";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "target";
                readonly type: "address";
            }, {
                readonly name: "value";
                readonly type: "uint256";
            }, {
                readonly name: "data";
                readonly type: "bytes";
            }];
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
        }, {
            readonly name: "deadline";
            readonly type: "uint256";
        }, {
            readonly name: "sig";
            readonly type: "bytes";
        }];
        readonly outputs: readonly [];
    }, {
        readonly type: "function";
        readonly name: "executeSelf";
        readonly stateMutability: "payable";
        readonly inputs: readonly [{
            readonly name: "calls";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "target";
                readonly type: "address";
            }, {
                readonly name: "value";
                readonly type: "uint256";
            }, {
                readonly name: "data";
                readonly type: "bytes";
            }];
        }];
        readonly outputs: readonly [];
    }, {
        readonly type: "function";
        readonly name: "digest";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly name: "calls";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "target";
                readonly type: "address";
            }, {
                readonly name: "value";
                readonly type: "uint256";
            }, {
                readonly name: "data";
                readonly type: "bytes";
            }];
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
        }, {
            readonly name: "deadline";
            readonly type: "uint256";
        }];
        readonly outputs: readonly [{
            readonly type: "bytes32";
        }];
    }];
};
export type AbiName = keyof typeof abis;
//# sourceMappingURL=abi.d.ts.map