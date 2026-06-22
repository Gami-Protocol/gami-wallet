import { defineChain } from 'viem';
import { arbitrum, base, polygon } from 'viem/chains';
import type { Chain } from 'viem';

/**
 * Supported chains for GAMI Wallet. EVM chains read/send via viem; Solana via
 * @solana/web3.js. Each chain declares a per-chain fee ceiling (in native
 * units) — sends whose estimated fee exceeds the ceiling are rejected.
 */

export type ChainKind = 'evm' | 'solana';

export type ChainId = 'gami' | 'base' | 'polygon' | 'arbitrum' | 'solana';

export type ChainConfig = {
  id: ChainId;
  kind: ChainKind;
  label: string;
  symbol: string;
  /** Accent color key for the chain pill. */
  accent: 'cyan' | 'purple' | 'magenta' | 'lime' | 'yellow';
  /** RPC endpoint. */
  rpc: string;
  /** Native-token decimals. */
  decimals: number;
  /** Max acceptable estimated fee in native units (e.g. 0.01 ETH). */
  feeCeiling: number;
  /** viem chain object for EVM chains. */
  viemChain?: Chain;
};

/**
 * Gami Protocol chain (gami-protocol-chain): a Cosmos SDK chain with EVM
 * compatibility via stateful precompiles (XP at 0x..0800, Treasury at 0x..0801).
 * It has no public testnet yet, so RPC, chain id and explorer are read from env
 * and default to the local devnet from the chain repo's wallet SDK. Override via
 * EXPO_PUBLIC_GAMI_RPC_URL / EXPO_PUBLIC_GAMI_CHAIN_ID / EXPO_PUBLIC_GAMI_EXPLORER_URL.
 */
const GAMI_RPC = process.env.EXPO_PUBLIC_GAMI_RPC_URL ?? 'http://localhost:8545';
const GAMI_CHAIN_ID = Number(process.env.EXPO_PUBLIC_GAMI_CHAIN_ID ?? '9000');
const GAMI_EXPLORER = process.env.EXPO_PUBLIC_GAMI_EXPLORER_URL;

export const gamiChain: Chain = defineChain({
  id: Number.isFinite(GAMI_CHAIN_ID) && GAMI_CHAIN_ID > 0 ? GAMI_CHAIN_ID : 9000,
  name: 'Gami',
  nativeCurrency: { name: 'GAMI', symbol: 'GAMI', decimals: 18 },
  rpcUrls: { default: { http: [GAMI_RPC] } },
  ...(GAMI_EXPLORER
    ? { blockExplorers: { default: { name: 'Gami Explorer', url: GAMI_EXPLORER } } }
    : {}),
  testnet: true,
});

export const CHAINS: Record<ChainId, ChainConfig> = {
  gami: {
    id: 'gami',
    kind: 'evm',
    label: 'Gami',
    symbol: 'GAMI',
    accent: 'yellow',
    rpc: GAMI_RPC,
    decimals: 18,
    feeCeiling: 0.01,
    viemChain: gamiChain,
  },
  base: {
    id: 'base',
    kind: 'evm',
    label: 'Base',
    symbol: 'ETH',
    accent: 'cyan',
    rpc: 'https://mainnet.base.org',
    decimals: 18,
    feeCeiling: 0.005,
    viemChain: base,
  },
  polygon: {
    id: 'polygon',
    kind: 'evm',
    label: 'Polygon',
    symbol: 'POL',
    accent: 'purple',
    rpc: 'https://polygon-rpc.com',
    decimals: 18,
    feeCeiling: 0.5,
    viemChain: polygon,
  },
  arbitrum: {
    id: 'arbitrum',
    kind: 'evm',
    label: 'Arbitrum',
    symbol: 'ETH',
    accent: 'magenta',
    rpc: 'https://arb1.arbitrum.io/rpc',
    decimals: 18,
    feeCeiling: 0.005,
    viemChain: arbitrum,
  },
  solana: {
    id: 'solana',
    kind: 'solana',
    label: 'Solana',
    symbol: 'SOL',
    accent: 'lime',
    rpc: 'https://api.mainnet-beta.solana.com',
    decimals: 9,
    feeCeiling: 0.01,
    viemChain: undefined,
  },
};

export const CHAIN_ORDER: ChainId[] = ['gami', 'base', 'polygon', 'arbitrum', 'solana'];
