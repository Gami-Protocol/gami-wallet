import { arbitrum, base, polygon } from 'viem/chains';
import type { Chain } from 'viem';

/**
 * Supported chains for GAMI Wallet. EVM chains read/send via viem; Solana via
 * @solana/web3.js. Each chain declares a per-chain fee ceiling (in native
 * units) — sends whose estimated fee exceeds the ceiling are rejected.
 */

export type ChainKind = 'evm' | 'solana';

export type ChainId = 'base' | 'polygon' | 'arbitrum' | 'solana';

export type ChainConfig = {
  id: ChainId;
  kind: ChainKind;
  label: string;
  symbol: string;
  /** Accent color key for the chain pill. */
  accent: 'cyan' | 'purple' | 'magenta' | 'lime';
  /** RPC endpoint. */
  rpc: string;
  /** Native-token decimals. */
  decimals: number;
  /** Max acceptable estimated fee in native units (e.g. 0.01 ETH). */
  feeCeiling: number;
  /** viem chain object for EVM chains. */
  viemChain?: Chain;
};

export const CHAINS: Record<ChainId, ChainConfig> = {
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

export const CHAIN_ORDER: ChainId[] = ['base', 'polygon', 'arbitrum', 'solana'];
